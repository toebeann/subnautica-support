import { getDiscovery } from '../utils';
import { util } from 'vortex-api';
import { IDiscoveryResult, IExtensionApi } from 'vortex-api/lib/types/api';

/**
 * Steam game id for Subnautica.
 */
export const STEAM_GAME_ID = '264710';

/**
 * Steam beta branches for Subnautica.
 */
export const STEAM_BETA_BRANCHES = [
    /**
     * Stable branch. Listed as '' in the manifest.
     */
    'stable',
    /**
     * Legacy branch. Listed as 'legacy' in the manifest. Only available on Steam.
     */
    'legacy',
    /**
     * Experimental branch. Listed as 'experimental' in the manifest. Only available on Steam.
     */
    'experimental'
] as const;

/**
 * Steam beta branches for Subnautica.
 */
export type SteamBetaBranch = typeof STEAM_BETA_BRANCHES[number];

/**
 * Steam app manifest.
 * Note: This does not contain all the properties of the manifest, only the ones we need.
 */
export interface SteamAppManifest {
    "AppState": {
        "UserConfig": {
            "BetaKey": string;
        }
        "MountedConfig": {
            "BetaKey": string;
        }
    }
}

/**
 * Asynchronously retrieves the current beta branch for Subnautica.
 * @param api 
 * @param discovery 
 * @returns The current beta branch for Subnautica. Returns 'stable' if the game is not discovered on Steam.
 */
export const getBranch = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)): Promise<SteamBetaBranch> => {
    switch (discovery?.store) {
        case 'steam':
            const entry = await util.GameStoreHelper.findByAppId([STEAM_GAME_ID], discovery.store);
            if ('manifestData' in entry) {
                return getBranchFromManifest(entry.manifestData);
            }
        default: // at present, steam is the only platform that supports beta branches
            return 'stable';
    }
}

/**
 * Retrieves the current beta branch for Subnautica from a given Steam app manifest
 * @param manifest 
 * @returns The current beta branch for Subnautica. Returns 'stable' if the manifest does not contain a valid beta branch.
 */
export const getBranchFromManifest = (manifest: SteamAppManifest): SteamBetaBranch => {
    const { UserConfig, MountedConfig } = manifest.AppState;
    const branch = (UserConfig.BetaKey || MountedConfig.BetaKey) as SteamBetaBranch;
    return STEAM_BETA_BRANCHES.includes(branch)
        ? branch
        : 'stable';
}
