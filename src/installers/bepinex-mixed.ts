import { basename, dirname, extname, join, sep } from 'path';
import { BEPINEX_CONFIG_DIR, BEPINEX_DIR, BEPINEX_PATCHERS_DIR, BEPINEX_PLUGINS_DIR } from '../bepinex';
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
    const targets = [BEPINEX_CONFIG_DIR, BEPINEX_PLUGINS_DIR, BEPINEX_PATCHERS_DIR];
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && targets.some(target => dirs.some(segments => segments.includes(target.toLowerCase())))
            && ((!dirs.some(segments => segments[0] === BEPINEX_DIR) || dirs.every(segments => targets.includes(segments[1])))
                || dirs.every(segments => targets.includes(segments[0])))
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
    const index = dirs.some(segments => segments[0] === BEPINEX_DIR) ? 0 : 1;
    return {
        instructions: [
            ...sansDirectories.map((file): IInstruction => {
                return {
                    type: 'copy',
                    source: file,
                    destination: join(dirname(file).split(sep).slice(index).join(sep), basename(file)),
                }
            })
        ]
    }
}

/**
 * Registers the BepInEx mixed plugin/patcher/etc. installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex-mixed', 60, testSupported, install);
export default register;

