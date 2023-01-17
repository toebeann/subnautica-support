import { join } from 'path';
import { TRANSLATION_OPTIONS } from './constants';
import { getDiscovery, getMods } from './utils';
import { BEPINEX_5_CORE_DLL, BEPINEX_5_MOD_TYPE } from './mod-types/bepinex-5';
import { BEPINEX_6_CORE_DLL, BEPINEX_6_MOD_TYPE } from './mod-types/bepinex-6';
import { fs, util } from 'vortex-api';
import { IDiscoveryResult, IExtensionApi } from 'vortex-api/lib/types/api';

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
export const isBepInExInstalled = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    if (getMods(api, true).some(mod => [BEPINEX_5_MOD_TYPE, BEPINEX_6_MOD_TYPE].includes(mod.type))) return true;
    else if (!discovery?.path) return false;
    else {
        try {
            await fs.statAsync(join(discovery.path, BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_5_CORE_DLL));
            return true;
        } catch {
            try {
                await fs.statAsync(join(discovery.path, BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_6_CORE_DLL));
                return true;
            } catch {
                return false;
            }
        }
    }
}

/**
 * Utility function to validate the BepInEx installation and notify the user of any issues.
 * @param api 
 */
export const validateBepInEx = async (api: IExtensionApi) => {
    if (!await isBepInExInstalled(api)) {
        api.sendNotification?.({
            id: 'bepinex-missing',
            type: 'warning',
            title: api.translate('{{bepinex}} not installed', TRANSLATION_OPTIONS),
            message: api.translate('{{bepinex}} is required to mod {{game}}.', TRANSLATION_OPTIONS),
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
}
