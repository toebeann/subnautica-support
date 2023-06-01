import { basename, dirname, extname, join, sep } from 'path';
import { QMM_MOD_PATH } from '../qmodmanager';
import { getDiscovery } from '../utils';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { types } from 'vortex-api';
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import IInstruction = types.IInstruction;
import IState = types.IState;

/**
 * QModManager Mod mod type.
 */
export const QMM_MOD_MOD_TYPE = 'qmodmanager-mod';

/**
 * QModManager mod manifest filename.
 */
export const QMM_MOD_MANIFEST = 'mod.json';

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
export const getPath = (state: IState, game: IGame): string => join(getDiscovery(state, game.id)?.path ?? '', QMM_MOD_PATH);

/**
 * Determines whether a given mod is of this mod type.
 * @returns 
 */
export const test = async (installInstructions: IInstruction[]): Promise<boolean> => {
    const copy = installInstructions.filter(instruction => instruction.type === 'copy');
    const copyDestinationsLowerCase = copy.filter(instruction => instruction.destination)
        .map(instruction => instruction.destination!.toLowerCase());
    const manifests = copyDestinationsLowerCase.filter(dest => basename(dest) === QMM_MOD_MANIFEST.toLowerCase());
    const manifestDir = basename(dirname(manifests[0] ?? ''));
    const destinationDirs = copyDestinationsLowerCase.map(dest => dirname(dest).split(sep));
    const index = destinationDirs[0]?.indexOf(manifestDir);
    return manifests.length === 1
        && copyDestinationsLowerCase.some(dest => extname(dest) === '.dll')
        && destinationDirs.every(segments => segments.indexOf(manifestDir.toLowerCase()) === index);
}

/**
 * Registers the QModManager Mod mod type with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) =>
    context.registerModType(
        QMM_MOD_MOD_TYPE,
        80,
        isSupported,
        (game: IGame) => getPath(context.api.getState(), game),
        test,
        {
            name: 'QModManager Mod',
            mergeMods: true
        }
    );
export default register;
