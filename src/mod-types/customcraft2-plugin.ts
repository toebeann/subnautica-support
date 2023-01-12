import { basename, dirname, extname, join, sep } from 'path';
import { getDiscovery, getModPath } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { IExtensionApi, IExtensionContext, IGame, IInstruction } from 'vortex-api/lib/types/api';
import { CUSTOMCRAFT2_FOLDER, CUSTOMCRAFT2_PLUGIN_FOLDERS } from '../installers/customcraft2-plugin';

/**
 * CustomCraft2 plugin mod type.
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
 * @param api 
 * @param game 
 * @returns 
 */
export const getPath = (api: IExtensionApi, game: IGame): string => getModPath(getDiscovery(api, game.id)?.path);

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
        (game: IGame) => getPath(context.api, game),
        test,
        {
            name: 'CustomCraft2 Plugin',
            mergeMods: true
        }
    );
export default register;
