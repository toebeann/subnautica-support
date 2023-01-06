import { join } from 'path';
import { GAME_EXE } from './constants';
import { NEXUS_GAME_ID } from './platforms/nexus';
import { getFileVersion } from 'exe-version';
import { fs } from 'vortex-api';
import { IDiscoveryResult, IExtensionApi } from 'vortex-api/lib/types/api';

/**
 * Utility function to determine the Subnautica game version.
 * @param gamePath The path to the Subnautica game directory.
 * @returns The Subnautica game version from the plastic_status.ignore file if it exists, otherwise the Unity version from the game executable.
 */
export const getGameVersion = async (gamePath: string): Promise<string> => {
    try {
        const plasticStatusPath = join(gamePath, 'Subnautica_Data', 'StreamingAssets', 'SNUnmanagedData', 'plastic_status.ignore');
        return await fs.readFileAsync(plasticStatusPath, { encoding: 'utf8' });
    } catch {
        return getUnityVersion(gamePath);
    }
}

/**
 * Utility function to determine the Unity version of the Subnautica game.
 * @param gamePath The path to the Subnautica game directory.
 * @returns The Unity version of the Subnautica game, or an empty string if the game executable could not be found.
 */
export const getUnityVersion = async (gamePath: string): Promise<string> => {
    try {
        const exePath = join(gamePath, GAME_EXE);
        return await getFileVersion(exePath);
    } catch {
        return '';
    }
}

/**
 * Utility function to retrieve the Subnautica game discovery result from the Vortex API.
 * @param api 
 * @param gameId 
 * @returns The Subnautica game discovery result, or undefined if the game has not been discovered.
 */
export const getDiscovery = (api: IExtensionApi, gameId: string = NEXUS_GAME_ID): IDiscoveryResult | undefined =>
    api.getState().settings.gameMode.discovered[gameId];
