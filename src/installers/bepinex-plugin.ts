import { execFile } from 'child_process';
import { basename, dirname, extname, join, sep } from 'path';
import { BEPINEX_INJECTOR_CORE_FILES } from './bepinex';
import { BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_PLUGINS_DIR } from '../bepinex';
import { getDiscovery } from '../utils';
import { BEPINEX_PLUGIN_MOD_TYPE } from '../mod-types/bepinex-plugin';
import { QMM_MOD_MANIFEST } from '../mod-types/qmodmanager-mod';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { getBranch } from '../platforms/steam';
import { IDiscoveryResult, IExtensionApi, IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';
import { z } from 'zod';

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());
    const assemblies = filesLowerCase.filter(file => extname(file) === '.dll');
    const assemblyDirs = assemblies.map(file => dirname(file).split(sep));
    const index = assemblyDirs[0]?.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase());
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && assemblies.length > 0
            && assemblyDirs.every(segments => segments.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase()) === index)
            && !BEPINEX_INJECTOR_CORE_FILES.every(file => filesLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, file).toLowerCase()))
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (api: IExtensionApi, files: string[], workingPath: string) => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const assembly = sansDirectories.find(file => extname(file).toLowerCase() === '.dll')!;
    const assemblyDir = basename(dirname(assembly));
    const assemblyDirIndex = assembly.split(sep).indexOf(assemblyDir);
    const filtered = sansDirectories.filter(file => file.split(sep).indexOf(assemblyDir) === assemblyDirIndex);
    const index = assembly.split(sep).indexOf(BEPINEX_PLUGINS_DIR);

    const instructions = filtered.map((source): IInstruction => ({
        type: 'copy',
        source,
        destination: join(dirname(source).split(sep).slice(index + 1).join(sep), basename(source)),
    }));

    // if the mod contains a QModManager manifest but we're not on the legacy branch,
    // determine whether the mod contains BepInEx plugins and set the mod type accordingly
    // to handle the case where a mod can be installed either as a QModManager mod or a BepInEx plugin
    if (sansDirectories.some(f => basename(f).toLowerCase() === QMM_MOD_MANIFEST)
        && await getBranch(api) !== 'legacy'
        && await hasBepInExPlugins(api, files, workingPath)) {
        instructions.push({
            type: 'setmodtype',
            value: BEPINEX_PLUGIN_MOD_TYPE
        });
    }

    return <IInstallResult>{ instructions };
}

/**
 * A helper utility to determine whether the given mod files contain BepInEx plugins via the BepInEx.AssemblyInspection.Console.exe command-line utility.
 * @param api 
 * @param files 
 * @param workingPath 
 * @param discovery 
 * @returns 
 */
const hasBepInExPlugins = async (api: IExtensionApi, files: string[], workingPath: string, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    if (!discovery?.path) return false;

    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const assemblies = sansDirectories.filter(file => extname(file).toLowerCase() === '.dll'.toLowerCase());
    const managedPath = join(discovery.path, 'Subnautica_Data', 'Managed');

    try {
        const booleanParser = z.boolean();

        for (const assembly of assemblies) {
            if (await new Promise<boolean>((resolve, reject) => {
                execFile(join(api.extension!.path, 'BepInEx.AssemblyInspection.Console.exe'),
                    [
                        '-t', 'Plugins',
                        '-f', JSON.stringify(join(workingPath, assembly)),
                        '-s', JSON.stringify(managedPath), JSON.stringify(join(discovery.path!, BEPINEX_DIR, BEPINEX_CORE_DIR)),
                    ], { windowsHide: true },
                    (error, stdout) => {
                        if (error) {
                            reject(error);
                        } else {
                            try {
                                resolve(booleanParser.parse(JSON.parse(stdout.trim())));
                            } catch {
                                resolve(false);
                            }
                        }
                    });
            })) return true;
        }
    } catch { }
    return false;
}

/**
 * Registers the BepInEx plugin installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex-plugin', 35, testSupported, (files, workingPath) => install(context.api, files, workingPath));
export default register;

