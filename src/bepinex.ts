import { join } from 'path';
import { store } from './';
import { TRANSLATION_OPTIONS } from './constants';
import { getDiscovery } from './utils';
import { SteamBetaBranch } from './platforms/steam';
import { fs, util } from 'vortex-api';
import { IDiscoveryResult, IExtensionApi } from 'vortex-api/lib/types/api';

/**
 * URL to the BepInEx page on Nexus Mods
 */
export const BEPINEX_URL = 'https://www.nexusmods.com/subnautica/mods/1108';
/**
 * BepInEx directory name
 */
export const BEPINEX_DIR = 'BepInEx';
/**
 * BepInEx core directory name
 */
export const BEPINEX_CORE_DIR = 'core';
/**
 * BepInEx plugins directory name
 */
export const BEPINEX_PLUGINS_DIR = 'plugins';
/**
 * BepInEx patchers directory name
 */
export const BEPINEX_PATCHERS_DIR = 'patchers';
/**
 * Path to the BepInEx plugins directory relative to the game directory
 */
export const BEPINEX_MOD_PATH = join(BEPINEX_DIR, BEPINEX_PLUGINS_DIR);
/**
 * Core BepInEx filename
 */
export const BEPINEX_DLL = 'BepInEx.dll';

/**
 * Asynchronously determines whether BepInEx is installed
 * @param api 
 * @param discovery 
 * @returns True if BepInEx is installed, false otherwise
 * @throws Error if the Subnatica game path has not been discovered
 */
export const isBepInExInstalled = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    // TODO: Refactor to check if BepInEx is installed via the Vortex API based on mod type. Make sure to update doc comments to reflect this change.
    if (discovery?.path) {
        try {
            await fs.statAsync(join(discovery.path, BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_DLL));
            return true;
        } catch {
            return false;
        }
    } else {
        throw new Error('Game not discovered');
    }
}

/**
 * Utility function to validate the BepInEx installation and notify the user of any issues
 * @param api 
 * @param discovery 
 */
export const validateBepInEx = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    let bepinexInstalled;
    try {
        bepinexInstalled = await isBepInExInstalled(api, discovery);
    } catch {
        // TODO: Display warning about game not discovered
        return;
    }

    const branch = store('branch') as SteamBetaBranch;
    switch (branch) {
        case 'experimental':
        case 'stable':
            if (!bepinexInstalled) {
                api.sendNotification!({
                    id: 'bepinex-missing',
                    type: 'warning',
                    title: api.translate('{{bepinex}} not installed', TRANSLATION_OPTIONS),
                    message: api.translate('{{bepinex}} is required to mod Subnautica since the 2.0 update.', TRANSLATION_OPTIONS),
                    actions: [
                        {
                            title: api.translate('Get {{bepinex}}', TRANSLATION_OPTIONS),
                            action: async () => {
                                try {
                                    await util.opn(BEPINEX_URL);
                                }
                                catch { }
                            }
                        }
                    ]
                });
            }
            break;
        default:
            if (bepinexInstalled) {
                // TODO: Display warning about BepInEx being installed on legacy branch
            }
            break;
    }
}
