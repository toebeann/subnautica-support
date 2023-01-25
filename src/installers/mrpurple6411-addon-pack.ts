import { basename, dirname, join, sep } from 'path';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';
import { parse } from 'relaxed-json';
import { fs, util } from 'vortex-api';

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
    const manifests = filesLowerCase.filter(file => basename(file) === MRPURPLE6411_ADDON_MANIFEST.toLowerCase());
    const rootDir = basename(dirname(dirname(manifests[0] ?? '')));
    const dirs = filesLowerCase.map(file => dirname(file).toLowerCase().split(sep));
    const index = dirs[0]?.indexOf(rootDir);

    return {
        requiredFiles: [join()],
        supported: gameId == NEXUS_GAME_ID
            && MRPURPLE6411_ADDON_FILES.every(file => filesLowerCase.map(f => basename(f)).includes(file.toLowerCase()))
    }
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (files: string[], workingPath: string): Promise<IInstallResult> => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const manifests = sansDirectories.filter(file => basename(file).toLowerCase() === MRPURPLE6411_ADDON_MANIFEST.toLowerCase());
    const rootDir = basename(dirname(dirname(manifests[0] ?? '')));
    const dirs = sansDirectories.map(file => dirname(file).toLowerCase().split(sep));
    const index = dirs[0]?.indexOf(rootDir);
    const filtered = manifests.filter(file => file.toLowerCase().split(sep).indexOf(rootDir) === index);
    const manifestsData = await Promise.all(filtered.map(async (manifest) => parse(util.deBOM(await fs.readFileAsync(join(workingPath, manifest), { encoding: 'utf-8' })))));
    const posterManifests = filtered.filter((_, index) => 'Orientation' in manifestsData[index]);
    const hullPlateManifests = filtered.filter(file => !posterManifests.includes(file));

    const filesFromManifestMap = async (manifest: string) => {
        return {
            files: sansDirectories.filter(file => dirname(file) === dirname(manifest)),
            folder: await getAddonName(manifest, workingPath),
            index: manifest.split(sep).indexOf(basename(dirname(manifest)))
        }
    }

    const posterFileMaps = await Promise.all(posterManifests.map(filesFromManifestMap));
    const hullPlatesFileMaps = await Promise.all(hullPlateManifests.map(filesFromManifestMap));

    return {
        instructions: [
            ...posterFileMaps.flatMap(fileMap => fileMap.files.map((source): IInstruction => {
                return {
                    type: 'copy',
                    source,
                    destination: join(CUSTOMPOSTERS_FOLDER, fileMap.folder, dirname(source).split(sep).slice(fileMap.index + 1).join(sep), basename(source))
                }
            })),
            ...hullPlatesFileMaps.flatMap(fileMap => fileMap.files.map((source): IInstruction => {
                return {
                    type: 'copy',
                    source,
                    destination: join(CUSTOMHULLPLATES_FOLDER, fileMap.folder, dirname(source).split(sep).slice(fileMap.index + 1).join(sep), basename(source))
                }
            }))
        ]
    }
}

const getAddonName = async (manifest: string, workingPath: string) => {
    const folder = basename(dirname(manifest));
    if (folder !== '.') return folder;

    try {
        const data = await fs.readFileAsync(join(workingPath, manifest), { encoding: 'utf-8' });
        const json = parse(util.deBOM(data));
        if ('InternalName' in json && typeof json.InternalName === 'string') {
            return json.InternalName as string;
        } else if ('InternalName' in json) {
            throw new util.DataInvalid(`Failed to parse ${MRPURPLE6411_ADDON_MANIFEST}: 'InternalName' is not a string`);
        } else {
            throw new util.DataInvalid(`Failed to parse ${MRPURPLE6411_ADDON_MANIFEST}: missing property 'InternalName'`);
        }
    } catch (e) {
        if (e instanceof util.DataInvalid) {
            throw e;
        } else {
            throw new util.DataInvalid(`Failed to parse ${MRPURPLE6411_ADDON_MANIFEST}`);
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

