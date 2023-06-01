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
import { basename, dirname, sep } from 'path';
import { getDiscovery, getModPath } from '../utils';
import { CUSTOMCRAFT2_FOLDER, CUSTOMCRAFT2_PLUGIN_FOLDERS } from '../installers/customcraft2-plugin';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;
import IState = types.IState;

/**
 * CustomCraft2 Plugin mod type.
 */
export const CUSTOMCRAFT2_PLUGIN_MOD_TYPE = 'customcraft2-plugin';

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
export const getPath = (state: IState, game: IGame): string => getModPath(getDiscovery(state, game.id)?.path);

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
    const index = sourceDirs[0]?.indexOf(CUSTOMCRAFT2_FOLDER.toLowerCase());
    return CUSTOMCRAFT2_PLUGIN_FOLDERS.some(folder => copyDestinationsLowerCase.some(dest => basename(dirname(dest)) == folder.toLowerCase()))
        && sourceDirs.every(segments => segments.indexOf(CUSTOMCRAFT2_FOLDER.toLowerCase()) === index);
}

/**
 * Registers the CustomCraft2 Plugin mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        CUSTOMCRAFT2_PLUGIN_MOD_TYPE,
        90,
        isSupported,
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'CustomCraft2 Plugin',
            mergeMods: true
        }
    );
export default register;
