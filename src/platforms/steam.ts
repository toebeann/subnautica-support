import { dirname, join } from 'path';
import { getDiscovery } from '../utils';
import parseAcf from 'steam-acf-parser';
import { fs } from 'vortex-api';
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
 * Retrieves the steam app manifest path
 * @param api 
 * @param discovery 
 * @returns 
 */
export const getManifestPath = (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)): string | void =>
    discovery?.path && discovery?.store === 'steam'
        ? join(dirname(dirname(discovery.path)), `appmanifest_${STEAM_GAME_ID}.acf`)
        : undefined;

/**
 * Asynchronously retrieves the steam app manifest for Subnautica.
 * @param api 
 * @param discovery 
 * @returns 
 */
export const getManifest = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    const path = getManifestPath(api, discovery);
    if (path) {
        const data = await fs.readFileAsync(path, { encoding: 'utf-8' });
        return parseAcf(data);
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
            if (!discovery.path) {
                return 'stable';
            }

            try {
                const manifest = await getManifest(api, discovery);
                if (manifest) {
                    return getBranchFromManifest(manifest);
                } else {
                    return 'stable';
                }
            } catch {
                return 'stable'; // if the manifest cannot be read, assume the game is on the stable branch
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
export const getBranchFromManifest = (manifest: parseAcf.AcfData): SteamBetaBranch => {
    const { UserConfig, MountedConfig } = manifest?.AppState;
    const branch = MountedConfig?.BetaKey ?? UserConfig?.BetaKey ?? 'stable'; // fallback to 'stable' if no branch is specified
    return STEAM_BETA_BRANCHES.includes(branch)
        ? branch
        : 'stable';
}
