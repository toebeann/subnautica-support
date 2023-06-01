/**
 * Subnautica Support - Vortex support for Subnautica
 * Copyright (C) 2023 Tobey Blaber
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, see <https://www.gnu.org/licenses>.
 */
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
