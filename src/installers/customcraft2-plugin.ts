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
import { basename, dirname, join, sep } from 'path';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IInstallResult = types.IInstallResult;
import IInstruction = types.IInstruction;
import TestSupported = types.TestSupported;

/**
 * CustomCraft2 root mod folder.
 */
export const CUSTOMCRAFT2_FOLDER = 'CustomCraft2SML';

/**
 * CustomCraft2 subfolders for plugins.
 */
export const CUSTOMCRAFT2_PLUGIN_FOLDERS = ['WorkingFiles', 'Assets'];

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());

    return {
        requiredFiles: [],
        supported: gameId == NEXUS_GAME_ID
            && CUSTOMCRAFT2_PLUGIN_FOLDERS.some(folder => filesLowerCase.some(file => basename(dirname(file)) === folder.toLowerCase()))
    }
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (files: string[]) => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const filtered = sansDirectories.filter(file => file.toLowerCase().includes(CUSTOMCRAFT2_FOLDER.toLowerCase()));
    const dirs = filtered.map(file => dirname(file).toLowerCase().split(sep));
    const index = dirs[0]?.indexOf(CUSTOMCRAFT2_FOLDER.toLowerCase());

    return <IInstallResult>{
        instructions: [
            ...filtered.map((source) => <IInstruction>({
                type: 'copy',
                source,
                destination: join(CUSTOMCRAFT2_FOLDER, dirname(source).split(sep).slice(index + 1).join(sep), basename(source))
            }))
        ]
    }
}

/**
 * Registers the MrPurple6411 addon pack installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('customcraft2-plugin', 42, testSupported, install);
export default register;

