import { store } from '.';
import { BEPINEX_URL } from './bepinex';
import { TRANSLATION_OPTIONS } from './constants';
import { getMods } from './utils';
import { QMM_4_MOD_TYPE } from './mod-types/qmodmanager-4';
import { SteamBetaBranch } from './platforms/steam';
import { util } from 'vortex-api';
import { IExtensionApi } from 'vortex-api/lib/types/api';

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
                api.sendNotification?.({
                    id: 'qmodmanager-missing',
                    type: 'warning',
                    title: api.translate('{{qmodmanager}} not installed', TRANSLATION_OPTIONS),
                    message: api.translate('On the {{legacy}} branch of {{game}}, {{qmodmanager}} is required.', TRANSLATION_OPTIONS),
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
            } else {
                api.dismissNotification?.('qmodmanager-missing');
            }
            break;
        default:
            if (isQModManagerInstalled(api)) {
                api.sendNotification?.({
                    id: 'qmodmanager-stable',
                    type: 'error',
                    title: api.translate(`{{qmodmanager}} installed on {{${store('branch')}}} branch`, TRANSLATION_OPTIONS),
                    message: api.translate('{{qmodmanager}} is only intended for use on the {{legacy}} branch. Please uninstall {{qmodmanager}}.', TRANSLATION_OPTIONS),
                    actions: [
                        { title: api.translate('More info', TRANSLATION_OPTIONS), action: () => util.opn('https://www.nexusmods.com/news/14813') },
                        { title: 'Get BepInEx', action: () => util.opn(BEPINEX_URL) }
                    ],
                    allowSuppress: true
                });
            }
            break;
    }
}
