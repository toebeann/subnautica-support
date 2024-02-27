/**
 * Subnautica Support - Vortex support for Subnautica
 * Copyright (C) 2023 Tobey Blaber
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, see <https://www.gnu.org/licenses>.
 */
import { execFile } from 'child_process';
import { join } from 'path';
import { store } from '.';
import { BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH } from './bepinex';
import { QMM_MOD_DIR } from './qmodmanager';
import { NEXUS_GAME_ID } from './platforms/nexus';
import { remark } from 'remark';
import rehypeFormat from 'rehype-format';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import strip from 'strip-markdown';
import { actions, fs, selectors, types, util } from 'vortex-api';
import { z } from 'zod';
import setModsEnabled = actions.setModsEnabled;
import statAsync = fs.statAsync;
import activeProfile = selectors.activeProfile;
import currentGame = selectors.currentGame;
import discoveryByGame = selectors.discoveryByGame;
import IDiscoveryResult = types.IDiscoveryResult;
import IExtensionApi = types.IExtensionApi;
import IMod = types.IMod;
import IState = types.IState;
import toPromise = util.toPromise;

/**
 * Utility function to retrieve a game discovery result from the Vortex API.
 * @param state 
 * @param gameId The game ID to retrieve the discovery result for. Defaults to Subnautica.
 * @returns The game discovery result, or undefined if the game has not been discovered.
 */
export const getDiscovery = (state: IState, gameId: string = NEXUS_GAME_ID): IDiscoveryResult | undefined =>
    discoveryByGame(state, gameId);

/**
 * Utility function to retrieve the path to the mods directory based on the current Steam beta branch.
 * @param gamePath The path to the Subnautica game directory.
 * @returns The path to the mods directory. If the current beta branch is unknown, the path to the BepInEx plugins directory is returned.
 */
export const getModPath = (gamePath: string = ''): string => join(gamePath, store('branch') === 'legacy' ? QMM_MOD_DIR : BEPINEX_MOD_PATH);

/**
 * Utility function to retrieve a list of mods for the specified game from the Vortex API.
 * @param state 
 * @param status Which mod types to retrieve.
 * @param gameId The game ID to retrieve the mods for. Defaults to Subnautica: Below Zero.
 * @returns A list of mods for the specified game.
 */
export const getMods = <T extends 'enabled' | 'disabled' | 'uninstalled' | 'all'>(state: IState, status: T = ('all' as T), gameId: string = NEXUS_GAME_ID):
    T extends 'enabled' | 'disabled' ? IMod[] :
    T extends 'uninstalled' ? (Pick<IMod, 'id'> & { state: 'uninstalled' })[] :
    T extends 'all' ? (IMod | (Pick<IMod, 'id'> & { state: 'uninstalled' }))[] :
    never => {
    const mods = Object.values(state.persistent.mods[gameId] ?? {});

    switch (status) {
        case 'enabled':
            const enabledModIds = Object.entries(activeProfile(state)?.modState ?? {}).filter(([_, value]) => value.enabled).map((([id]) => id));
            return mods.filter(mod => enabledModIds.includes(mod.id)) as ReturnType<typeof getMods<T>>;
        case 'disabled':
            const disabledModIds = Object.entries(activeProfile(state)?.modState ?? {}).filter(([_, value]) => !value.enabled).map((([id]) => id));
            return mods.filter(mod => disabledModIds.includes(mod.id)) as ReturnType<typeof getMods<T>>;
        case 'uninstalled':
            return Object.keys(activeProfile(state)?.modState ?? {}).filter(id => !mods.map(mod => mod.id).includes(id)).map(id => ({ id, state: 'uninstalled' })) as ReturnType<typeof getMods<T>>;
        case 'all':
        default:
            return [
                ...mods,
                ...getMods(state, 'uninstalled', gameId) as (Pick<IMod, 'id'> & { state: 'uninstalled' })[]
            ] as ReturnType<typeof getMods<T>>;
    }
}

/**
 * Utility function to reinstall a mod via the Vortex API.
 * @param api 
 * @param mod The mod to reinstall.
 * @param gameId The game ID to reinstall the mod for. Defaults to Subnautica: Below Zero.
 * @returns True if the mod was reinstalled, false otherwise.
 */
export const reinstallMod = (api: IExtensionApi, mod: IMod, gameId: string = NEXUS_GAME_ID): Promise<boolean> => {
    if (currentGame(api.getState())?.id !== gameId ||
        !mod.attributes?.fileName) {
        return Promise.resolve(false);
    }

    return toPromise(callback => api.events.emit('start-install-download', mod.archiveId, {
        choices: mod.attributes?.installerChoices,
        allowAutoEnable: false
    }, callback));
}

/**
 * Utility function to enable/disable mods via the Vortex API.
 * @param api 
 * @param enabled Whether the mod(s) should be enabled or disabled.
 * @param modIds The ID(s) of the mods to enable/disable.
 * @returns 
 */
export const enableMods = (api: IExtensionApi, enabled: boolean, ...modIds: string[]) => setModsEnabled(api, activeProfile(api.getState()).id, modIds, enabled);

/**
 * Utility function to determine if a path is a file on disk.
 * @param path 
 * @returns 
 */
export const isFile = async (path: string) => {
    try {
        return (await statAsync(path)).isFile();
    } catch {
        return false;
    }
}

/**
 * Strips markdown formatting from the given string.
 * @param markdown 
 * @returns 
 */
export const stripMarkdown = async (markdown: string) => String(
    await remark()
        .use(strip)
        .process(markdown))
    .trim();

/**
 * Converts a given markdown string to HTML.
 * @param markdown 
 * @param references An optional array of references to be used to convert markdown links with references to HTML links.
 * @returns 
 */
export const markdownToHtml = async (markdown: string, references?: string[]) => String(
    await remark()
        .use(remarkRehype)
        .use(rehypeFormat)
        .use(rehypeStringify)
        .process(`${markdown}\n\n${references?.join('\n') || ''}`))
    .trim();

const assemblyInspectionParser = z.object({
    HasPlugins: z.boolean(),
    HasPatchers: z.boolean(),
    Plugins: z.array(z.string()),
    Patchers: z.array(z.string()),
});

/**
 * A helper utility to determine whether a given assembly contains BepInEx plugins or patchers
 * via the BepInEx.AssemblyInspection.Console.exe command-line utility.
 * @param api 
 * @param path The file path of the assembly to inspect.
 * @param discovery 
 * @param additionalSearchPaths Additional paths to search when attempting to resolve dependencies.
 * The Subnautica Managed assemblies and BepInEx core assemblies are always searched.
 * @returns The parsed output of the BepInEx.AssemblyInspection.Console.exe utility.
 */
export const inspectAssembly = (api: IExtensionApi, path: string, discovery = getDiscovery(api.getState()), additionalSearchPaths: string[] = []) =>
    new Promise<z.infer<typeof assemblyInspectionParser>>((resolve, reject) => {
        try {
            execFile(join(api.extension!.path, 'BepInEx.AssemblyInspection.Console.exe'),
                [
                    '-f', JSON.stringify(path),
                    '-s', ...[
                        ...(discovery?.path
                            ? [
                                join(discovery.path, 'Subnautica_Data', 'Managed'),
                                join(discovery.path, BEPINEX_DIR, BEPINEX_CORE_DIR),
                            ]
                            : []),
                        ...additionalSearchPaths,
                    ].map(path => JSON.stringify(path)),
                ], { windowsHide: true },
                (error, stdout) => {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            resolve(assemblyInspectionParser.parse(JSON.parse(stdout.trim())));
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
        } catch (error) {
            reject(error);
        }
    });

/**
 * A helper utility to determine whether a given assembly contains BepInEx plugins
 * via the BepInEx.AssemblyInspection.Console.exe command-line utility.
 * @param api 
 * @param path The file path of the assembly to inspect.
 * @param discovery 
 * @param additionalSearchPaths Additional paths to search when attempting to resolve dependencies.
 * The Subnautica Managed assemblies and BepInEx core assemblies are always searched.
 * @returns True if the assembly contains BepInEx plugins, false otherwise.
 */
export const assemblyHasBepInExPlugins = async (api: IExtensionApi, path: string, discovery = getDiscovery(api.getState()), additionalSearchPaths: string[] = []) => {
    try {
        return (await inspectAssembly(api, path, discovery, additionalSearchPaths)).HasPlugins;
    } catch { }
    return false;
}

/**
 * A helper utility to determine whether the given assembly contains BepInEx patchers
 * via the BepInEx.AssemblyInspection.Console.exe command-line utility.
 * @param api 
 * @param path The file path of the assembly to inspect.
 * @param discovery 
 * @param additionalSearchPaths Additional paths to search when attempting to resolve dependencies.
 * The Subnautica Managed assemblies and BepInEx core assemblies are always searched.
 * @returns 
 */
export const assemblyHasBepInExPatchers = async (api: IExtensionApi, path: string, discovery = getDiscovery(api.getState()), additionalSearchPaths: string[] = []) => {
    try {
        return (await inspectAssembly(api, path, discovery, additionalSearchPaths)).HasPatchers;
    } catch { }
    return false;
}

/**
 * An async implementation of the Array.some() method which executes the predicates in series.
 * Short-circuits on the first predicate that resolves true, or when a predicate rejects if swallowRejects is false.
 * @param array 
 * @param predicate 
 * @param swallowRejections Whether rejected promises should be swallowed or rejected.
 * Swallowed rejections are treated as false predicate results.
 * Defaults to true.
 * @returns Whether any value in the array passes the predicate.
 */
export const someSeries = async <T>(array: T[], predicate: (value: T) => Promise<boolean>, swallowRejections = true) => {
    for (const value of array) {
        try {
            if (await predicate(value)) return true;
        } catch (error) {
            if (!swallowRejections) throw new Error(`The value of ${value} was rejected with the following error: ${error}`);
        }
    }
    return false;
}

/**
 * An async implementation of the Array.some() method which executes the predicates in parallel.
 * Short-circuits on the first predicate that resolves true, or when a predicate rejects if swallowRejects is false.
 * @param array 
 * @param predicate 
 * @param swallowRejections Whether rejected promises should be swallowed or rejected.
 * Swallowed rejections are treated as false predicate results.
 * Defaults to true.
 * @returns Whether any value in the array passes the predicate.
 */
export const some = <T>(array: T[], predicate: (value: T) => Promise<boolean>, swallowRejections = true) =>
    new Promise<boolean>((resolve, reject) => {
        Promise.allSettled(
            array.map(value =>
                predicate(value)
                    .then(result => { if (result) resolve(true) })
                    .catch((error) => { if (!swallowRejections) reject(new Error(`The value of ${value} was rejected with the following error: ${error}`)) })))
            .then(() => resolve(false));
    });

/**
 * An async implementation of the Array.every() method which executes the predicates in series.
 * Short-circuits on the first predicate that resolves false, or when a predicate rejects.
 * @param array 
 * @param predicate 
 * @param swallowRejections Whether rejected promises should be swallowed or rejected.
 * Swallowed rejections are treated as false predicate results.
 * Defaults to true.
 * @returns Whether all values in the array pass the predicate.
 */
export const everySeries = async <T>(array: T[], predicate: (value: T) => Promise<boolean>, swallowRejections = true) => {
    for (const value of array) {
        try {
            if (!await predicate(value)) return false;
        } catch (error) {
            if (!swallowRejections) throw new Error(`The value of ${value} was rejected with the following error: ${error}`);
            else return false;
        }
    }
    return true;
}

/**
 * An async implementation of the Array.every() method which executes the predicates in parallel.
 * Short-circuits on the first predicate that resolves false, or when a predicate rejects.
 * @param array 
 * @param predicate 
 * @param swallowRejections Whether rejected promises should be swallowed or rejected.
 * Swallowed rejections are treated as false predicate results.
 * Defaults to true.
 * @returns Whether all values in the array pass the predicate.
 */
export const every = <T>(array: T[], predicate: (value: T) => Promise<boolean>, swallowRejections = true) =>
    new Promise<boolean>((resolve, reject) => {
        Promise.allSettled(
            array.map(value =>
                predicate(value)
                    .then(result => { if (!result) resolve(false) })
                    .catch((error) => {
                        if (!swallowRejections) reject(new Error(`The value of ${value} was rejected with the following error: ${error}`));
                        else resolve(false);
                    })))
            .then(() => resolve(true));
    });
