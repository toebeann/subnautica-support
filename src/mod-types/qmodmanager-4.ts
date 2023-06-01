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
import { join } from 'path';
import { getPath, isSupported } from './bepinex-5';
import { BEPINEX_PLUGINS_DIR } from '../bepinex';
import { QMM_DIR } from '../qmodmanager';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;

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
    .map(instruction => instruction.destination!)
    .some(destination => destination.toLowerCase().endsWith(join(BEPINEX_PLUGINS_DIR, QMM_DIR, QMM_CORE_DLL).toLowerCase()));

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
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'QModManager 4',
            mergeMods: true
        }
    );
export default register;
