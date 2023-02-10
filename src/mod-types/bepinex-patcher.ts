import { dirname, extname, join, sep } from 'path';
import { BEPINEX_DIR, BEPINEX_PATCHERS_DIR } from '../bepinex';
import { getDiscovery } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionApi, IExtensionContext, IGame, IInstruction } from 'vortex-api/lib/types/api';

/**
 * BepInEx Patcher mod type.
 */
export const BEPINEX_PATCHER_MOD_TYPE = 'bepinex-patcher';

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
    const copy = installInstructions.filter(instruction => instruction.type === 'copy');
    const copyDestinationsLowerCase = copy.filter(instruction => instruction.destination)
        .map(instruction => instruction.destination!.toLowerCase());
    const destinationDirs = copyDestinationsLowerCase.map(dest => dirname(dest).split(sep));
    return copyDestinationsLowerCase.some(dest => extname(dest) === '.dll')
        && destinationDirs.every(segments => segments.indexOf(BEPINEX_PATCHERS_DIR.toLowerCase()) === 0);
}

/**
 * Registers the BepInEx patcher mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        BEPINEX_PATCHER_MOD_TYPE,
        80,
        isSupported,
        (game: IGame) => getPath(context.api, game),
        test,
        {
            name: 'BepInEx Patcher',
            mergeMods: true
        }
    );
export default register;
