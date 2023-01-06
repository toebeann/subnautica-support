import { dirname, join, sep } from 'path';
import { BEPINEX_CONFIG_DIR, BEPINEX_DIR, BEPINEX_PATCHERS_DIR, BEPINEX_PLUGINS_DIR } from '../bepinex';
import { getDiscovery } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionApi, IExtensionContext, IGame, IInstruction } from 'vortex-api/lib/types/api';

/**
 * BepInEx mixed mod type.
 */
export const BEPINEX_MIXED_MOD_TYPE = 'bepinex-mixed';

/**
 * Determines whether the mod type is supported for the specified game.
 * @param gameId 
 * @returns 
 */
export const isSupported = (gameId: string): boolean => gameId === NEXUS_GAME_ID;

/**
 * Retrieves the absolute path to the installation directory for this mod type.
 * @param api 
 * @param game 
 * @returns 
 */
export const getPath = (api: IExtensionApi, game: IGame): string => join(getDiscovery(api, game.id)?.path ?? '', BEPINEX_DIR);

/**
 * Determines whether a given mod is of this mod type.
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => {
    const sourceDirs = installInstructions.filter(instruction => instruction.type === 'copy' && instruction.source)
        .map(instruction => dirname(instruction.source!).toLowerCase().split(sep));
    const targets = [BEPINEX_CONFIG_DIR, BEPINEX_PLUGINS_DIR, BEPINEX_PATCHERS_DIR];
    return targets.some(target => sourceDirs.some(segments => segments.includes(target.toLowerCase())))
        && ((!sourceDirs.some(segments => segments[0] === BEPINEX_DIR) || sourceDirs.every(segments => targets.includes(segments[1])))
            || sourceDirs.every(segments => targets.includes(segments[0])));
}

/**
 * Registers the BepInEx mixed mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        BEPINEX_MIXED_MOD_TYPE,
        100,
        isSupported,
        (game: IGame) => getPath(context.api, game),
        test,
        {
            name: 'BepInEx Mod',
            mergeMods: true
        }
    );
export default register;
