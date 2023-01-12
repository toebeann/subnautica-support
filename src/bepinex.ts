import { join } from 'path';
import { store } from '.';
import { TRANSLATION_OPTIONS } from './constants';
import { QMM_URL } from './qmodmanager';
import { getMods } from './utils';
import { BEPINEX_5_MOD_TYPE } from './mod-types/bepinex-5';
import { BEPINEX_6_MOD_TYPE } from './mod-types/bepinex-6';
import { SteamBetaBranch } from './platforms/steam';
import { util } from 'vortex-api';
import { IExtensionApi } from 'vortex-api/lib/types/api';

/**
 * URL to the BepInEx page on Nexus Mods.
 */
export const BEPINEX_URL = 'https://www.nexusmods.com/subnautica/mods/1108';
/**
 * BepInEx directory name.
 */
export const BEPINEX_DIR = 'BepInEx';
/**
 * BepInEx core directory name.
 */
export const BEPINEX_CORE_DIR = 'core';
/**
 * BepInEx config directory name.
 */
export const BEPINEX_CONFIG_DIR = 'config';
/**
 * BepInEx plugins directory name.
 */
export const BEPINEX_PLUGINS_DIR = 'plugins';
/**
 * BepInEx patchers directory name.
 */
export const BEPINEX_PATCHERS_DIR = 'patchers';
/**
 * Path to the BepInEx plugins directory relative to the game directory.
 */
export const BEPINEX_MOD_PATH = join(BEPINEX_DIR, BEPINEX_PLUGINS_DIR);

/**
 * Utility function to determine whether BepInEx is installed via the Vortex API.
 * @param api 
 * @returns True if BepInEx is installed, false otherwise. Always returns false if BepInEx was not installed via Vortex.
 */
export const isBepInExInstalled = (api: IExtensionApi) =>
    getMods(api, true).some(mod => [BEPINEX_5_MOD_TYPE, BEPINEX_6_MOD_TYPE].includes(mod.type));

/**
 * Utility function to validate the BepInEx installation and notify the user of any issues.
 * @param api 
 */
export const validateBepInEx = async (api: IExtensionApi) => {
    const branch = store('branch') as SteamBetaBranch;
    switch (branch) {
        case 'experimental':
        case 'stable':
            api.dismissNotification?.('qmodmanager-missing');
            if (!isBepInExInstalled(api)) {
                api.sendNotification?.({
                    id: 'bepinex-missing',
                    type: 'warning',
                    title: api.translate('{{bepinex}} not installed', TRANSLATION_OPTIONS),
                    message: api.translate('Since the {{game}} 2.0 update, {{bepinex}} is required.', TRANSLATION_OPTIONS),
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
            } else {
                api.dismissNotification?.('bepinex-missing');
            }
            break;
        default:
            if (isBepInExInstalled(api)) {
                if (!store('suppress-bepinex-legacy-dialog')) {
                    const bbcode = api.translate('{{bepinex}} appears to be installed on the {{legacy}} branch of {{game}}.{{br}}{{br}}' +
                        'Please be aware that {{bepinex}} is not intended for use on the {{legacy}} branch, and mods made for {{bepinex}} are unlikely to work on this branch.{{br}}{{br}}' +
                        'It is advised to uninstall {{bepinex}} and instead install {{qmodmanager}}.', TRANSLATION_OPTIONS);
                    const result = await api.showDialog?.('error', api.translate('{{bepinex}} installed on {{legacy}} branch', TRANSLATION_OPTIONS), {
                        bbcode,
                        checkboxes: [
                            {
                                id: 'suppress-bepinex-legacy-dialog',
                                text: api.translate('I understand, don\'t show this message again.', TRANSLATION_OPTIONS),
                                value: false
                            }
                        ]
                    }, [
                        { label: api.translate('Get {{qmodmanager}}', TRANSLATION_OPTIONS), action: () => util.opn(QMM_URL) },
                        { label: api.translate('More info', TRANSLATION_OPTIONS), action: () => util.opn('https://www.nexusmods.com/news/14813') },
                        { label: api.translate('Close', TRANSLATION_OPTIONS) }
                    ], 'bepinex-legacy-dialog');

                    if (result) {
                        store('suppress-bepinex-legacy-dialog', result.input['suppress-bepinex-legacy-dialog']);
                    }
                }
            }
            break;
    }
}
