import { dirname, extname, join, sep } from 'path';
import { BEPINEX_MOD_PATH, BEPINEX_PLUGINS_DIR } from '../bepinex';
import { getDiscovery } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionApi, IExtensionContext, IGame, IInstruction } from 'vortex-api/lib/types/api';

/**
 * BepInEx plugin mod type.
 */
export const BEPINEX_PLUGIN_MOD_TYPE = 'bepinex-plugin';

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
export const getPath = (api: IExtensionApi, game: IGame): string => join(getDiscovery(api, game.id)?.path ?? '', BEPINEX_MOD_PATH);

/**
 * Determines whether a given mod is of this mod type.
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => {
    const copy = installInstructions.filter(instruction => instruction.type === 'copy');
    const copyDestinationsLowerCase = copy.filter(instruction => instruction.destination)
        .map(instruction => instruction.destination!.toLowerCase());
    const sourceDirs = copy.filter(instruction => instruction.source)
        .map(instruction => dirname(instruction.source!).toLowerCase().split(sep));
    return copyDestinationsLowerCase.some(dest => extname(dest) === '.dll')
        && sourceDirs.every(segments => segments.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase()) === sourceDirs[0]?.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase()));
}

/**
 * Registers the BepInEx plugin mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        BEPINEX_PLUGIN_MOD_TYPE,
        90,
        isSupported,
        (game: IGame) => getPath(context.api, game),
        test,
        {
            name: 'BepInEx Plugin',
            mergeMods: true
        }
    );
export default register;
