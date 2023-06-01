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
import { CUSTOMPOSTERS_FOLDER, MRPURPLE6411_ADDON_FILES, MRPURPLE6411_ADDON_MANIFEST } from '../installers/mrpurple6411-addon-pack';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;
import IState = types.IState;

/**
 * CustomPosters Pack mod type.
 */
export const CUSTOMPOSTERS_PACK_MOD_TYPE = 'customposters-pack';

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
    const manifests = copyDestinationsLowerCase.filter(dest => basename(dest) === MRPURPLE6411_ADDON_MANIFEST.toLowerCase());
    const rootDir = basename(dirname(dirname(manifests[0] ?? '')));
    const destinationDirs = copyDestinationsLowerCase.map(dest => dirname(dest).split(sep));
    const index = destinationDirs[0]?.indexOf(rootDir);
    return rootDir.toLowerCase() === CUSTOMPOSTERS_FOLDER.toLowerCase()
        && destinationDirs.every(segments => segments.indexOf(rootDir.toLowerCase()) === index)
        && MRPURPLE6411_ADDON_FILES.every(file => copyDestinationsLowerCase.map(f => basename(f)).includes(file.toLowerCase()));
}

/**
 * Registers the CustomPosters Pack mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        CUSTOMPOSTERS_PACK_MOD_TYPE,
        90,
        isSupported,
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'CustomPosters Pack',
            mergeMods: true
        }
    );
export default register;
