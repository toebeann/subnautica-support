import { basename, dirname, extname, join, sep } from 'path';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';
import { parse } from 'relaxed-json';
import { fs, log, util } from 'vortex-api';

/**
 * QModManager mod manifest filename.
 */
export const QMM_MOD_MANIFEST = 'mod.json';

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());
    const manifests = filesLowerCase.filter(file => basename(file) === QMM_MOD_MANIFEST.toLowerCase());
    if (manifests.length > 1) {
        log('error', `Not supported: found multiple ${QMM_MOD_MANIFEST} files`, { manifests });
    }

    return {
        requiredFiles: [],
        supported: gameId == NEXUS_GAME_ID
            && manifests.length === 1
            && filesLowerCase.some(file => extname(file) === '.dll')
    }
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (files: string[], destination: string): Promise<IInstallResult> => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const manifest = sansDirectories.find(file => basename(file.toLowerCase()) === QMM_MOD_MANIFEST.toLowerCase())!;
    const manifestDir = basename(dirname(manifest));
    const index = manifest.split(sep).indexOf(manifestDir);
    const modName = await getModName(manifest, destination);
    const filtered = sansDirectories.filter(file => file.split(sep).indexOf(manifestDir) === index);

    return {
        instructions: [
            ...filtered.map((source): IInstruction => {
                return {
                    type: 'copy',
                    source,
                    destination: join(modName, dirname(source).split(sep).slice(index + 1).join(sep), basename(source)),
                }
            })
        ]
    }
}

/**
 * Retrieves the mod name for a QModManager mod from its manifest.json file.
 * @param manifest 
 * @param destination 
 * @returns 
 */
const getModName = async (manifest: string, destination: string) => {
    const folder = basename(dirname(manifest));
    if (folder !== '.') return folder;

    try {
        const data = await fs.readFileAsync(join(destination, manifest), { encoding: 'utf-8' });
        const json = parse(util.deBOM(data));
        if ('Id' in json && typeof json.Id === 'string') {
            return json.Id as string;
        } else if ('Id' in json) {
            throw new util.DataInvalid(`Failed to parse ${QMM_MOD_MANIFEST}: 'Id' is not a string`);
        } else {
            throw new util.DataInvalid(`Failed to parse ${QMM_MOD_MANIFEST}: missing property 'Id'`);
        }
    } catch (e) {
        if (e instanceof util.DataInvalid) {
            throw e;
        } else {
            throw new util.DataInvalid(`Failed to parse ${QMM_MOD_MANIFEST}`);
        }
    }
}

/**
 * Registers the BepInEx plugin installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('qmodmanager-mod', 40, testSupported, install);
export default register;

