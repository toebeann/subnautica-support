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
