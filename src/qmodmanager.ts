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
 * Utility function to determine whether QModManager is installed via the Vortex API.
 * @param api 
 * @returns True if QModManager is installed, false otherwise. Always returns false if QModManager was not installed via Vortex.
 */
export const isQModManagerInstalled = (api: IExtensionApi) =>
    getMods(api, true).some(mod => mod.type === QMM_4_MOD_TYPE || mod.type === 'dinput');

/**
 * Utility function to validate the QModManager installation and notify the user of any issues.
 * @param api 
 */
export const validateQModManager = async (api: IExtensionApi) => {
    switch (store('branch') as SteamBetaBranch) {
        case 'legacy':
            api.dismissNotification?.('bepinex-missing');
            if (!isQModManagerInstalled(api)) {
                api.sendNotification?.({
                    id: 'qmodmanager-missing',
                    type: 'warning',
                    title: api.translate('{{qmodmanager}} not installed', TRANSLATION_OPTIONS),
                    message: api.translate('On the legacy branch of {{game}}, {{qmodmanager}} is required.', TRANSLATION_OPTIONS),
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
                if (!store('suppress-qmodmanager-stable-dialog')) {
                    const bbcode = api.translate(`{{qmodmanager}} appears to be installed on the {{${store('branch')}}} branch of {{game}}.{{br}}{{br}}` +
                        'Please be aware that {{qmodmanager}} is only intended for use on the {{legacy}} branch and will not be receiving any updates.{{br}}{{br}}' +
                        'It is strongly advised to uninstall {{qmodmanager}} and instead install {{bepinex}}.', TRANSLATION_OPTIONS);
                    const result = await api.showDialog?.('error', api.translate(`{{qmodmanager}} installed on {{${store('branch')}}} branch`, TRANSLATION_OPTIONS), {
                        bbcode,
                        checkboxes: [
                            {
                                id: 'suppress-qmodmanager-stable-dialog',
                                text: api.translate('I understand, don\'t show this message again.', TRANSLATION_OPTIONS),
                                value: false
                            }
                        ]
                    }, [
                        { label: api.translate('Get {{bepinex}}', TRANSLATION_OPTIONS), action: () => util.opn(BEPINEX_URL)},
                        { label: api.translate('More info', TRANSLATION_OPTIONS), action: () => util.opn('https://www.nexusmods.com/news/14813') },
                        { label: api.translate('Close', TRANSLATION_OPTIONS) }
                    ], 'bepinex-legacy-dialog');

                    if (result) {
                        store('suppress-qmodmanager-stable-dialog', result.input['suppress-qmodmanager-stable-dialog']);
                    }
                }
            }
            break;
    }
}
