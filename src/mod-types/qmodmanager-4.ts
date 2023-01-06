import { join } from 'path';
import { getPath, isSupported } from './bepinex-5';
import { BEPINEX_MOD_PATH } from '../bepinex';
import { QMM_DIR } from '../qmodmanager';
import { IExtensionContext, IGame, IInstruction } from 'vortex-api/lib/types/api';

/**
 * QModManager 4 mod type.
 */
export const QMM_4_MOD_TYPE = 'qmodmanager-4';

/**
 * QModManager core filename.
 */
export const QMM_CORE_DLL = 'QModInstaller.dll';

/**
 * Determines whether a given mod is of this mod type.
 * @param installInstructions 
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => installInstructions
    .filter(instruction => instruction.type === 'copy' && instruction.destination)
    .map(instruction => instruction.destination!.toLowerCase())
    .includes(join(BEPINEX_MOD_PATH, QMM_DIR, QMM_CORE_DLL).toLowerCase());

/**
 * Registers the QModManager 4 mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        QMM_4_MOD_TYPE,
        50,
        isSupported,
        (game: IGame) => getPath(context.api, game),
        test,
        {
            name: 'QModManager 4',
            mergeMods: true
        }
    );
export default register;
