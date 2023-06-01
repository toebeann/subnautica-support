import { dirname, join, sep } from 'path';
import { BEPINEX_CONFIG_DIR, BEPINEX_DIR, BEPINEX_PATCHERS_DIR, BEPINEX_PLUGINS_DIR } from '../bepinex';
import { getDiscovery } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;
import IState = types.IState;

/**
 * BepInEx Mod mod type.
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
 * @param state 
 * @param game 
 * @returns 
 */
export const getPath = (state: IState, game: IGame): string => join(getDiscovery(state, game.id)?.path ?? '', BEPINEX_DIR);

/**
 * Determines whether a given mod is of this mod type.
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => {
    const copy = installInstructions.filter(instruction => instruction.type === 'copy');
    const copyDestinationsLowerCase = copy.filter(instruction => instruction.destination)
        .map(instruction => instruction.destination!.toLowerCase());
    const destinationDirs = copyDestinationsLowerCase.map(dest => dirname(dest).split(sep));
    const targets = [BEPINEX_CONFIG_DIR, BEPINEX_PLUGINS_DIR, BEPINEX_PATCHERS_DIR];
    return targets.some(target => destinationDirs.some(segments => segments.includes(target.toLowerCase())))
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
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'BepInEx Mod',
            mergeMods: true
        }
    );
export default register;
