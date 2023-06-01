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
import { types } from 'vortex-api';
import IGameStoreEntry = types.IGameStoreEntry;

/**
 * Xbox game id for Subnautica.
 */
export const XBOX_GAME_ID = 'UnknownWorldsEntertainmen.GAMEPREVIEWSubnautica';

/**
 * Xbox app executable name used to launch the game.
 */
export const XBOX_APP_EXEC_NAME = 'App';

/**
 * Gets the Xbox app executable name used to launch the game.
 * @param gameStoreEntry 
 * @returns The Xbox app executable name used to launch the game.
 */
export const getAppExecName = (gameStoreEntry: IGameStoreEntry) =>
    'executionName' in gameStoreEntry && typeof gameStoreEntry.executionName === 'string'
        ? gameStoreEntry.executionName
        : XBOX_APP_EXEC_NAME;
