/**
 * Subnautica Support - Vortex support for Subnautica
 * Copyright (C) 2023 Tobey Blaber
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, see <https://www.gnu.org/licenses>.
 */
import { dirname, join } from 'path';
import { getDiscovery } from '../utils';
import parseAcf from 'steam-acf-parser';
import { fs, types } from 'vortex-api';
import readFileAsync = fs.readFileAsync;
import IDiscoveryResult = types.IDiscoveryResult;
import IExtensionApi = types.IExtensionApi;
import IState = types.IState;

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
 * @param state 
 * @param discovery 
 * @returns 
 */
export const getManifestPath = (state: IState, discovery: IDiscoveryResult | undefined = getDiscovery(state)): string | void =>
    discovery?.path && discovery?.store === 'steam'
        ? join(dirname(dirname(discovery.path)), `appmanifest_${STEAM_GAME_ID}.acf`)
        : undefined;

/**
 * Asynchronously retrieves the steam app manifest for Subnautica.
 * @param state 
 * @param discovery 
 * @returns 
 */
export const getManifest = async (state: IState, discovery: IDiscoveryResult | undefined = getDiscovery(state)) => {
    const path = getManifestPath(state, discovery);
    if (path) {
        const data = await readFileAsync(path, { encoding: 'utf-8' });
        return parseAcf(data);
    }
}

/**
 * Asynchronously retrieves the current beta branch for Subnautica.
 * @param state 
 * @param discovery 
 * @returns The current beta branch for Subnautica. Returns 'stable' if the game is not discovered on Steam.
 */
export const getBranch = async (state: IState, discovery: IDiscoveryResult | undefined = getDiscovery(state)): Promise<SteamBetaBranch> => {
    switch (discovery?.store) {
        case 'steam':
            if (!discovery.path) {
                return 'stable';
            }

            try {
                const manifest = await getManifest(state, discovery);
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
