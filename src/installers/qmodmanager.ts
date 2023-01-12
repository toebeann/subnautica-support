import { basename, sep } from 'path';
import { QMM_CORE_DLL } from '../mod-types/qmodmanager-4';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionApi, IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && files.map(file => basename(file).toLowerCase()).includes(QMM_CORE_DLL.toLowerCase()),
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param api 
 * @param files 
 * @returns 
 */
export const install = async (api: IExtensionApi, files: string[]): Promise<IInstallResult> => {
    api.dismissNotification?.('qmodmanager-missing');

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
 * Registers the QModManager installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('qmodmanager', 55, testSupported, (files) => install(context.api, files));
export default register;
