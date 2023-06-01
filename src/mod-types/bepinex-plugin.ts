import { dirname, extname, join, sep } from 'path';
import { BEPINEX_MOD_PATH, BEPINEX_PLUGINS_DIR } from '../bepinex';
import { getDiscovery } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;
import IState = types.IState;

/**
 * BepInEx Plugin mod type.
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
 * @param state 
 * @param game 
 * @returns 
 */
export const getPath = (state: IState, game: IGame): string => join(getDiscovery(state, game.id)?.path ?? '', BEPINEX_MOD_PATH);

/**
 * Determines whether a given mod is of this mod type.
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => {
    const copy = installInstructions.filter(instruction => instruction.type === 'copy');
    const copyDestinationsLowerCase = copy.filter(instruction => instruction.destination)
        .map(instruction => instruction.destination!.toLowerCase());
    const destinationDirs = copyDestinationsLowerCase.map(dest => dirname(dest).split(sep));
    const index = destinationDirs[0]?.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase());
    return copyDestinationsLowerCase.some(dest => extname(dest) === '.dll')
        && destinationDirs.every(segments => segments.indexOf(BEPINEX_PLUGINS_DIR.toLowerCase()) === index);
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
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'BepInEx Plugin',
            mergeMods: true
        }
    );
export default register;
