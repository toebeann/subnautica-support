import { join } from 'path';
import { store } from '.';
import { GAME_EXE } from './constants';
import { BEPINEX_MOD_PATH } from './bepinex';
import { QMM_MOD_PATH } from './qmodmanager';
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

/**
 * Utility function to retrieve the path to the mods directory based on the current Steam beta branch.
 * @param gamePath The path to the Subnautica game directory.
 * @returns The path to the mods directory. If the current beta branch is unknown, the path to the BepInEx plugins directory is returned.
 */
export const getModPath = (gamePath: string): string => join(gamePath, store('branch') === 'legacy' ? QMM_MOD_PATH : BEPINEX_MOD_PATH);
