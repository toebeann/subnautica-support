import { basename, dirname, extname, join, sep } from 'path';
import { BEPINEX_PLUGINS_DIR } from '../bepinex';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => extname(file).length > 0).map(file => file.toLowerCase());
    const dirs = filesLowerCase.map(file => dirname(file).split(sep));
    const index = dirs[0]?.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase());
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && filesLowerCase.some(file => extname(file) === '.dll')
            && dirs.every(segments => segments.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase()) === index)
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (files: string[]): Promise<IInstallResult> => {
    const sansDirectories = files.filter(file => extname(file).length > 0);
    const dirs = sansDirectories.map(file => dirname(file).toLowerCase().split(sep));
    const index = dirs[0]?.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase());
    return {
        instructions: [
            ...sansDirectories.map((file): IInstruction => {
                return {
                    type: 'copy',
                    source: file,
                    destination: join(dirname(file).split(sep).slice(index + 1).join(sep), basename(file)),
                }
            })
        ]
    }
}

/**
 * Registers the BepInEx plugin installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex-plugin', 35, testSupported, install);
export default register;

