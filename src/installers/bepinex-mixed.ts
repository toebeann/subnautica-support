import { basename, dirname, join, sep } from 'path';
import { BEPINEX_CONFIG_DIR, BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH, BEPINEX_PATCHERS_DIR, BEPINEX_PLUGINS_DIR } from '../bepinex';
import { QMM_DIR } from '../qmodmanager';
import { QMM_CORE_DLL } from '../mod-types/qmodmanager-4';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionApi = types.IExtensionApi;
import IExtensionContext = types.IExtensionContext;
import IInstallResult = types.IInstallResult;
import IInstruction = types.IInstruction;
import TestSupported = types.TestSupported;

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());
    const dirs = filesLowerCase.map(file => dirname(file).split(sep));
    const targets = [BEPINEX_CONFIG_DIR, BEPINEX_PLUGINS_DIR, BEPINEX_PATCHERS_DIR];
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && targets.some(target => dirs.some(segments => segments.includes(target.toLowerCase())))
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (api: IExtensionApi, files: string[]) => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const isQMM = sansDirectories.map(file => file.toLowerCase()).includes(join(BEPINEX_MOD_PATH, QMM_DIR, QMM_CORE_DLL).toLowerCase());
    const dirs = sansDirectories.map(file => dirname(file).toLowerCase().split(sep));
    const index = dirs.some(segments => segments[0] === BEPINEX_DIR.toLowerCase()) ? 1 : 0;
    const filtered = sansDirectories.filter(file =>
        file.split(sep).length > index
        && (file.split(sep)[index].toLowerCase() !== BEPINEX_CORE_DIR.toLowerCase()
            || (isQMM && ['0harmony109.dll', '0harmony12.dll'].includes(basename(file).toLowerCase())))
        && (!isQMM || basename(file).toLowerCase() !== 'bepinex.cfg'));

    if (isQMM) {
        api.dismissNotification?.('reinstall-qmm');
    }

    return <IInstallResult>{
        instructions: [
            ...filtered.map((source) => <IInstruction>({
                type: 'copy',
                source,
                destination: join(dirname(source).split(sep).slice(index).join(sep), basename(source)),
            }))
        ]
    }
}

/**
 * Registers the BepInEx mixed plugin/patcher/etc. installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex-mixed', 60, testSupported, (files) => install(context.api, files));
export default register;

