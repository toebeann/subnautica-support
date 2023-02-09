import { join } from 'path';
import { store } from '.';
import { GAME_EXE, UNITY_PLAYER } from './constants';
import { BEPINEX_MOD_PATH } from './bepinex';
import { QMM_MOD_PATH } from './qmodmanager';
import { NEXUS_GAME_ID } from './platforms/nexus';
import { getFileVersion, getProductVersion } from 'exe-version';
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
        return (await fs.readFileAsync(plasticStatusPath, { encoding: 'utf8' })).trim()
            || (await getUnityVersion(gamePath)).trim()
            || 'Unknown';
    } catch {
        return getUnityVersion(gamePath) || 'Unknown';
    }
}

/**
 * Gets the game version from the Unity executable.
 * @param gamePath 
 * @returns 
 */
export const getUnityVersion = async (gamePath: string) => {
    const exePath = join(gamePath, GAME_EXE);
    const playerPath = join(gamePath, UNITY_PLAYER);
    try {
        return await getProductVersion(exePath);
    } catch {
        try {
            return await getProductVersion(playerPath);
        } catch {
            try {
                return await getFileVersion(exePath);
            } catch {
                try {
                    return await getFileVersion(playerPath);
                } catch {
                    return undefined;
                }
            }
        }
    }
}

/**
 * Utility function to retrieve a game discovery result from the Vortex API.
 * @param api 
 * @param gameId The game ID to retrieve the discovery result for. Defaults to Subnautica.
 * @returns The game discovery result, or undefined if the game has not been discovered.
 */
export const getDiscovery = (api: IExtensionApi, gameId: string = NEXUS_GAME_ID): IDiscoveryResult | undefined =>
    api.getState().settings.gameMode.discovered[gameId];

/**
 * Utility function to retrieve the path to the mods directory based on the current Steam beta branch.
 * @param gamePath The path to the Subnautica game directory.
 * @returns The path to the mods directory. If the current beta branch is unknown, the path to the BepInEx plugins directory is returned.
 */
export const getModPath = (gamePath: string = ''): string => join(gamePath, store('branch') === 'legacy' ? QMM_MOD_PATH : BEPINEX_MOD_PATH);

/**
 * Utility function to retrieve a list of mods for the specified game from the Vortex API.
 * @param api 
 * @param onlyInstalled Whether to filter the list to only installed mods.
 * @param gameId The game ID to retrieve the mods for. Defaults to Subnautica.
 * @returns A list of mods for the specified game.
 */
export const getMods = (api: IExtensionApi, onlyInstalled = false, gameId: string = NEXUS_GAME_ID) => {
    const mods = Object.values(api.getState().persistent.mods[gameId] ?? {});

    return onlyInstalled
        ? mods.filter(mod => mod.state === 'installed')
        : mods;
}
