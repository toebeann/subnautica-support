import { join } from 'path';
import { store } from '.';
import { BEPINEX_MOD_PATH } from './bepinex';
import { QMM_MOD_PATH } from './qmodmanager';
import { NEXUS_GAME_ID } from './platforms/nexus';
import { fs, selectors, types } from 'vortex-api';
import statAsync = fs.statAsync;
import activeProfile = selectors.activeProfile;
import IDiscoveryResult = types.IDiscoveryResult;
import IExtensionApi = types.IExtensionApi;
import IMod = types.IMod;
import IState = types.IState;

/**
 * Utility function to retrieve a game discovery result from the Vortex API.
 * @param api 
 * @param gameId The game ID to retrieve the discovery result for. Defaults to Subnautica.
 * @returns The game discovery result, or undefined if the game has not been discovered.
 */
export const getDiscovery = (api: IExtensionApi, gameId: string = NEXUS_GAME_ID): IDiscoveryResult | undefined =>
    api.getState().settings.gameMode.discovered[gameId];

/**
 * Utility function to retrieve the path to the mods directory based on the current Steam beta branch.
 * @param gamePath The path to the Subnautica game directory.
 * @returns The path to the mods directory. If the current beta branch is unknown, the path to the BepInEx plugins directory is returned.
 */
export const getModPath = (gamePath: string = ''): string => join(gamePath, store('branch') === 'legacy' ? QMM_MOD_PATH : BEPINEX_MOD_PATH);

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
            const enabledModIds = Object.entries(activeProfile(state)?.modState ?? {}).filter(([_, entry]) => entry.enabled).map((([id]) => id));
            return mods.filter(mod => enabledModIds.includes(mod.id)) as ReturnType<typeof getMods<T>>;
        case 'disabled':
            const disabledModIds = Object.entries(activeProfile(state)?.modState ?? {}).filter(([_, entry]) => !entry.enabled).map((([id]) => id));
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
