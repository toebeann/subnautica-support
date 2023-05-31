import { store } from '.';
import { TRANSLATION_OPTIONS } from './constants';
import { getMods } from './utils';
import { QMM_4_MOD_TYPE } from './mod-types/qmodmanager-4';
import { SteamBetaBranch } from './platforms/steam';
import { types, util } from 'vortex-api';
import IExtensionApi = types.IExtensionApi;
import opn = util.opn;

/**
 * URL to the QModManager page on Nexus Mods.
 */
export const QMM_URL = 'https://www.nexusmods.com/subnautica/mods/201/';
/**
 * QModManager directory name.
 */
export const QMM_DIR = 'QModManager';
/**
 * Path to the QModManager mods directory relative to the game directory.
 */
export const QMM_MOD_PATH = 'QMods';

/**
 * Utility function to determine whether QModManager is installed via the Vortex API.
 * @param api 
 * @returns True if QModManager is installed, false otherwise. Always returns false if QModManager was not installed via Vortex.
 */
export const isQModManagerInstalled = (api: IExtensionApi) =>
    getMods(api, true).some(mod => mod.attributes?.homepage === QMM_URL
        || (mod.attributes?.modId === 201 && mod.attributes?.downloadGame === 'subnautica')
        || mod.type === QMM_4_MOD_TYPE);

/**
 * Utility function to validate the QModManager installation and notify the user of any issues.
 * @param api 
 */
export const validateQModManager = async (api: IExtensionApi) => {
    switch (store('branch') as SteamBetaBranch) {
        case 'legacy':
            if (!isQModManagerInstalled(api)) {
                api.dismissNotification?.('qmodmanager-stable');

                api.sendNotification?.({
                    id: 'qmodmanager-missing',
                    type: 'warning',
                    title: api.translate('{{qmodmanager}} not installed', TRANSLATION_OPTIONS),
                    message: api.translate('On the {{legacy}} branch of {{game}}, {{qmodmanager}} is required.', TRANSLATION_OPTIONS),
                    actions: [
                        {
                            title: api.translate('Get QMM'),
                            action: () => opn(QMM_URL)
                        }
                    ]
                });
            } else {
                api.dismissNotification?.('qmodmanager-missing');
                api.dismissNotification?.('qmodmanager-stable');
            }
            break;
        default:
            api.dismissNotification?.('qmodmanager-missing');

            if (isQModManagerInstalled(api)) {
                api.sendNotification?.({
                    id: 'qmodmanager-stable',
                    type: 'error',
                    title: api.translate('Please uninstall {{qmodmanager}}.', TRANSLATION_OPTIONS),
                    message: api.translate('{{qmodmanager}} is only intended for use on the {{legacy}} branch.', TRANSLATION_OPTIONS),
                    allowSuppress: true
                });
            } else {
                api.dismissNotification?.('qmodmanager-stable');
            }
            break;
    }
}
