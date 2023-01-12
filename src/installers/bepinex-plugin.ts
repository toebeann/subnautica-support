import { basename, dirname, extname, join, sep } from 'path';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';
import { BEPINEX_PLUGINS_DIR } from '../bepinex';

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());
    const assemblies = filesLowerCase.filter(file => extname(file) === '.dll');
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && assemblies.length > 0
            && assemblies.every(file => file.split(sep).indexOf(basename(dirname(assemblies[0]))) === assemblies[0].split(sep).indexOf(basename(dirname(assemblies[0]))))
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param files 
 * @returns 
 */
export const install = async (files: string[]): Promise<IInstallResult> => {
    const sansDirectories = files.filter(file => !file.endsWith(sep));
    const assembly = sansDirectories.find(file => extname(file).toLowerCase() === '.dll')!;
    const assemblyDir = basename(dirname(assembly));
    const assemblyDirIndex = assembly.split(sep).indexOf(assemblyDir);
    const filtered = sansDirectories.filter(file => file.split(sep).indexOf(assemblyDir) === assemblyDirIndex);
    const index = assembly.split(sep).indexOf(BEPINEX_PLUGINS_DIR);

    return {
        instructions: [
            ...filtered.map((source): IInstruction => {
                return {
                    type: 'copy',
                    source,
                    destination: join(dirname(source).split(sep).slice(index + 1).join(sep), basename(source)),
                }
            })
        ]
    }
}

/**
 * Registers the BepInEx plugin installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex-plugin', 35, testSupported, install);
export default register;

