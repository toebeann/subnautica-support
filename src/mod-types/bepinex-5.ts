import { join, sep } from 'path';
import { QMM_CORE_DLL } from './qmodmanager-4';
import { BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH } from '../bepinex';
import { QMM_DIR } from '../qmodmanager';
import { getDiscovery } from '../utils';
import { BEPINEX_INJECTOR_CORE_FILES } from '../installers/bepinex';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;
import IState = types.IState;

/**
 * BepInEx 5 mod type.
 */
export const BEPINEX_5_MOD_TYPE = 'bepinex-5';

/**
 * BepInEx 5 core filename.
 */
export const BEPINEX_5_CORE_DLL = 'BepInEx.dll';

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
export const getPath = (state: IState, game: IGame): string => getDiscovery(state, game.id)?.path ?? '';

/**
 * Determines whether a given mod is of this mod type.
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => {
    const copyDestinationsLowerCase = installInstructions
        .filter(instruction => instruction.type === 'copy' && instruction.destination)
        .map(instruction => instruction.destination!.toLowerCase());
    return copyDestinationsLowerCase.some(dest => dest.split(sep)[0] === BEPINEX_DIR.toLowerCase())
        && !copyDestinationsLowerCase.includes(join(BEPINEX_MOD_PATH, QMM_DIR, QMM_CORE_DLL).toLowerCase())
        && [...BEPINEX_INJECTOR_CORE_FILES, BEPINEX_5_CORE_DLL].every(file => copyDestinationsLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, file).toLowerCase()));
}

/**
 * Registers the BepInEx 5 mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        BEPINEX_5_MOD_TYPE,
        50,
        isSupported,
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'BepInEx 5',
            mergeMods: true
        }
    );
export default register;
