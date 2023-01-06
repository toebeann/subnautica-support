import { join } from 'path';
import { store } from '.';
import { TRANSLATION_OPTIONS } from './constants';
import { getMods } from './utils';
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
 * Core BepInEx filename.
 */
export const BEPINEX_DLL = 'BepInEx.dll';
/**
 * BepInEx injector mod type.
 */
export const BEPINEX_INJECTOR_MODTYPE = 'bepinex-injector';
/**
 * BepInEx Root mod type.
 */
export const BEPINEX_ROOT_MODTYPE = 'bepinex-root';
/**
 * BepInEx plugin mod type.
 */
export const BEPINEX_PLUGIN_MODTYPE = 'bepinex-plugin';
/**
 * BepInEx patcher mod type.
 */
export const BEPINEX_PATCHER_MODTYPE = 'bepinex-patcher';

/**
 * Utility function to determine whether BepInEx is installed via the Vortex API.
 * @param api 
 * @returns True if BepInEx is installed, false otherwise. Always returns false if BepInEx was not installed via Vortex.
 */
export const isBepInExInstalled = (api: IExtensionApi) =>
    getMods(api, true).some(mod => mod.type === BEPINEX_INJECTOR_MODTYPE);

/**
 * Utility function to validate the BepInEx installation and notify the user of any issues.
 * @param api 
 */
export const validateBepInEx = async (api: IExtensionApi) => {
    const branch = store('branch') as SteamBetaBranch;
    switch (branch) {
        case 'experimental':
        case 'stable':
            if (!isBepInExInstalled(api)) {
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
            if (isBepInExInstalled(api)) {
                // TODO: Display warning about BepInEx being installed on legacy branch
            }
            break;
    }
}
