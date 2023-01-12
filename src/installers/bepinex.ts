import { join, sep } from 'path';
import { BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH } from '../bepinex';
import { QMM_DIR } from '../qmodmanager';
import { BEPINEX_5_CORE_DLL } from '../mod-types/bepinex-5';
import { BEPINEX_6_CORE_DLL } from '../mod-types/bepinex-6';
import { QMM_CORE_DLL } from '../mod-types/qmodmanager-4';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionApi, IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';

/**
 * BepInEx core filenames.
 */
export const BEPINEX_INJECTOR_CORE_FILES = ['0Harmony.dll', 'Mono.Cecil.dll', 'MonoMod.RuntimeDetour.dll', 'MonoMod.Utils.dll'] as const;

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && filesLowerCase.some(file => file.split(sep)[0] === BEPINEX_DIR.toLowerCase())
            && !filesLowerCase.includes(join(BEPINEX_MOD_PATH, QMM_DIR, QMM_CORE_DLL).toLowerCase())
            && (filesLowerCase.includes(BEPINEX_5_CORE_DLL.toLowerCase())
                || filesLowerCase.includes(BEPINEX_6_CORE_DLL.toLowerCase()))
            && BEPINEX_INJECTOR_CORE_FILES.every(file => filesLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, file).toLowerCase()))
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param api 
 * @param files 
 * @returns 
 */
export const install = async (api: IExtensionApi, files: string[]): Promise<IInstallResult> => {
    api.dismissNotification?.('bepinex-missing');

    return {
        instructions: [
            ...files.filter(file => !file.endsWith(sep)).map((source): IInstruction => {
                return {
                    type: 'copy',
                    source,
                    destination: source
                }
            })
        ]
    }
}

/**
 * Registers the BepInEx installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex', 50, testSupported, (files) => install(context.api, files));
export default register;
