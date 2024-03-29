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
import { parse } from 'relaxed-json';
import { fs, types, util } from 'vortex-api';
import readFileAsync = fs.readFileAsync;
import IExtensionContext = types.IExtensionContext;
import IInstallResult = types.IInstallResult;
import IInstruction = types.IInstruction;
import TestSupported = types.TestSupported;
import DataInvalid = util.DataInvalid;
import deBOM = util.deBOM;

/**
 * MrPurple6411 addon manifest filename.
 */
export const MRPURPLE6411_ADDON_MANIFEST = 'info.json';
/**
 * MrPurple6411 addon files.
 */
export const MRPURPLE6411_ADDON_FILES = [MRPURPLE6411_ADDON_MANIFEST, 'icon.png', 'texture.png'];
export const CUSTOMPOSTERS_FOLDER = 'CustomPosters';
export const CUSTOMHULLPLATES_FOLDER = 'CustomHullPlates';

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
            && MRPURPLE6411_ADDON_FILES.every(file => filesLowerCase.map(f => basename(f)).includes(file.toLowerCase()))
    }
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (files: string[], workingPath: string) => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const manifests = sansDirectories.filter(file => basename(file).toLowerCase() === MRPURPLE6411_ADDON_MANIFEST.toLowerCase());
    const rootDir = basename(dirname(dirname(manifests[0] ?? '')));
    const manifestDirs = manifests.map(file => dirname(file).toLowerCase().split(sep));
    const index = manifestDirs[0]?.indexOf(rootDir);
    const filtered = manifests.filter(file => file.toLowerCase().split(sep).indexOf(rootDir) === index);
    const manifestsData = await Promise.all(filtered.map(async (manifest) => parse(deBOM(await readFileAsync(join(workingPath, manifest), { encoding: 'utf-8' })))));
    const posterManifests = filtered.filter((_, index) => 'Orientation' in manifestsData[index]);
    const hullPlateManifests = filtered.filter(file => !posterManifests.includes(file));

    const filesFromManifestMap = async (manifest: string) => ({
        files: sansDirectories.filter(file => dirname(file) === dirname(manifest)),
        folder: await getAddonName(manifest, workingPath),
        index: manifest.split(sep).indexOf(basename(dirname(manifest)))
    });

    const posterFileMaps = await Promise.all(posterManifests.map(filesFromManifestMap));
    const hullPlatesFileMaps = await Promise.all(hullPlateManifests.map(filesFromManifestMap));

    return <IInstallResult>{
        instructions: [
            ...posterFileMaps.flatMap(fileMap => fileMap.files.map((source) => <IInstruction>({
                type: 'copy',
                source,
                destination: join(CUSTOMPOSTERS_FOLDER, 'Posters', fileMap.folder, dirname(source).split(sep).slice(fileMap.index + 1).join(sep), basename(source))
            }))),
            ...hullPlatesFileMaps.flatMap(fileMap => fileMap.files.map((source) => <IInstruction>({
                type: 'copy',
                source,
                destination: join(CUSTOMHULLPLATES_FOLDER, 'HullPlates', fileMap.folder, dirname(source).split(sep).slice(fileMap.index + 1).join(sep), basename(source))
            })))
        ]
    }
}

const getAddonName = async (manifest: string, workingPath: string) => {
    const folder = basename(dirname(manifest));
    if (folder !== '.') return folder;

    try {
        const data = await readFileAsync(join(workingPath, manifest), { encoding: 'utf-8' });
        const json = parse(deBOM(data));
        if ('InternalName' in json && typeof json.InternalName === 'string') {
            return json.InternalName as string;
        } else if ('InternalName' in json) {
            throw new DataInvalid(`Failed to parse ${MRPURPLE6411_ADDON_MANIFEST}: 'InternalName' is not a string`);
        } else {
            throw new DataInvalid(`Failed to parse ${MRPURPLE6411_ADDON_MANIFEST}: missing property 'InternalName'`);
        }
    } catch (e) {
        if (e instanceof DataInvalid) {
            throw e;
        } else {
            throw new DataInvalid(`Failed to parse ${MRPURPLE6411_ADDON_MANIFEST}`);
        }
    }
};

/**
 * Registers the MrPurple6411 addon pack installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('mrpurple6411-addon-pack', 41, testSupported, install);
export default register;

