import { join, sep } from 'path';
import { getPath, isSupported } from './bepinex-5';
import { QMM_CORE_DLL } from './qmodmanager-4';
import { BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH } from '../bepinex';
import { QMM_DIR } from '../qmodmanager';
import { BEPINEX_INJECTOR_CORE_FILES } from '../installers/bepinex';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;

/**
 * BepInEx 6 mod type.
 */
export const BEPINEX_6_MOD_TYPE = 'bepinex-6';

/**
 * BepInEx 6 core filename.
 */
export const BEPINEX_6_CORE_DLL = 'BepInEx.Core.dll';

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
        && [...BEPINEX_INJECTOR_CORE_FILES, BEPINEX_6_CORE_DLL].every(file => copyDestinationsLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, file).toLowerCase()));
}

/**
 * Registers the BepInEx 6 mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        BEPINEX_6_MOD_TYPE,
        50,
        isSupported,
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'BepInEx 6',
            mergeMods: true
        }
    );
export default register;
