import { join } from 'path';
import { store } from '.';
import { BEPINEX_PLUGINS_DIR, BEPINEX_DIR } from './bepinex';
import { getDiscovery } from './utils';
import { SteamBetaBranch } from './platforms/steam';
import { fs, util } from 'vortex-api';
import { IDiscoveryResult, IExtensionApi } from 'vortex-api/lib/types/api';

/**
 * URL to the QModManager page on Nexus Mods
 */
export const QMM_URL = 'https://www.nexusmods.com/subnautica/mods/201';
/**
 * QModManager directory name
 */
export const QMM_DIR = 'QModManager';
/**
 * Path to the QModManager mods directory relative to the game directory
 */
export const QMM_MOD_PATH = 'QMods';
/**
 * QModManager core filename
 */
export const QMM_DLL = 'QModInstaller.dll';
/**
 * QModManager mod manifest filename
 */
export const QMM_MOD_MANIFEST = 'mod.json';
/**
 * QModManager mod addon manifest filename for eg. CustomHullPlates and CustomPosters
 */
export const ADDON_MANIFEST = 'info.json';
/**
 * CustomCraft2 mod packaging folder
 */
export const CC2_FOLDER = 'CustomCraft2SML';

/**
 * Asynchronously determines whether QModManager is installed
 * @param api 
 * @param discovery 
 * @returns True if QModManager is installed, false otherwise
 * @throws Error if the Subnatica game path has not been discovered
 */
export const isQMMInstalled = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    // TODO: Refactor to check if QModManager is installed via the Vortex API based on mod type. Make sure to update doc comments to reflect this change.
    if (discovery?.path) {
        try {
            await fs.statAsync(join(discovery.path, BEPINEX_DIR, BEPINEX_PLUGINS_DIR, QMM_DIR, QMM_DLL));
            return true;
        } catch {
            return false;
        }
    } else {
        throw new Error('Game not discovered');
    }
}

/**
 * Utility function to validate the QModManager installation and notify the user of any issues
 * @param api 
 * @param discovery 
 */
export const validateQMM = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    let qmmInstalled;
    try {
        qmmInstalled = await isQMMInstalled(api, discovery);
    } catch {
        // TODO: Display warning about game not discovered
        return;
    }

    switch (store('branch') as SteamBetaBranch) {
        case 'legacy':
            if (!qmmInstalled) {
                api.sendNotification!({
                    id: 'qmm-missing',
                    type: 'warning',
                    title: api.translate('QModManager not installed'),
                    message: api.translate('QMM is required to mod Subnautica on the legacy branch.'),
                    actions: [
                        {
                            title: api.translate('Get QMM'),
                            action: async () => {
                                try {
                                    await util.opn(QMM_URL);
                                }
                                catch { }
                            }
                        }
                    ]
                });
            }
            break;
        default:
            if (qmmInstalled) {
                // TODO: Display warning about QMM being installed on experimental/stable branch
            }
            break;
    }
}
