import { store } from '.';
import { getMods } from './utils';
import { SteamBetaBranch } from './platforms/steam';
import { util } from 'vortex-api';
import { IExtensionApi } from 'vortex-api/lib/types/api';

/**
 * URL to the QModManager page on Nexus Mods.
 */
export const QMM_URL = 'https://www.nexusmods.com/subnautica/mods/201';
/**
 * QModManager directory name.
 */
export const QMM_DIR = 'QModManager';
/**
 * Path to the QModManager mods directory relative to the game directory.
 */
export const QMM_MOD_PATH = 'QMods';
/**
 * QModManager core filename.
 */
export const QMM_DLL = 'QModInstaller.dll';
/**
 * QModManager injector mod type.
 */
export const QMM_INJECTOR_MODTYPE = 'qmodmanager-injector';
/**
 * QModManager mod type.
 */
export const QMM_MOD_MODTYPE = 'qmodmanager-mod';
/**
 * CustomHullPlates pack mod type.
 */
export const QMM_CUSTOM_HULL_PLATES_PACK_MODTYPE = 'qmodmanager-custom-hull-plates-pack';
/**
 * CustomPosters pack mod type.
 */
export const QMM_CUSTOM_POSTERS_PACK_MODTYPE = 'qmodmanager-custom-posters-pack';
/**
 * CustomCraft2 plugin mod type.
 */
export const QMM_CC2_PLUGIN_MODTYPE = 'qmodmanager-cc2-plugin';
/**
 * QModManager mod manifest filename.
 */
export const QMM_MOD_MANIFEST = 'mod.json';
/**
 * QModManager mod addon manifest filename for CustomHullPlates and CustomPosters.
 */
export const ADDON_MANIFEST = 'info.json';
/**
 * CustomCraft2 plugin packaging folder.
 */
export const CC2_FOLDER = 'CustomCraft2SML';

/**
 * Utility function to determine whether QModManager is installed via the Vortex API.
 * @param api 
 * @returns True if QModManager is installed, false otherwise. Always returns false if QModManager was not installed via Vortex.
 */
export const isQModManagerInstalled = (api: IExtensionApi) =>
    getMods(api, true).some(mod => mod.type === QMM_INJECTOR_MODTYPE);

/**
 * Utility function to validate the QModManager installation and notify the user of any issues.
 * @param api 
 */
export const validateQModManager = async (api: IExtensionApi) => {
    switch (store('branch') as SteamBetaBranch) {
        case 'legacy':
            if (!isQModManagerInstalled(api)) {
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
            if (isQModManagerInstalled(api)) {
                // TODO: Display warning about QMM being installed on experimental/stable branch
            }
            break;
    }
}
