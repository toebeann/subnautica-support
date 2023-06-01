import { join } from 'path';
import { TRANSLATION_OPTIONS } from './constants';
import { enableMods, getDiscovery, getMods } from './utils';
import { BEPINEX_5_CORE_DLL, BEPINEX_5_MOD_TYPE } from './mod-types/bepinex-5';
import { BEPINEX_6_CORE_DLL, BEPINEX_6_MOD_TYPE } from './mod-types/bepinex-6';
import { fs, types, util } from 'vortex-api';
import statAsync = fs.statAsync;
import IDiscoveryResult = types.IDiscoveryResult;
import IExtensionApi = types.IExtensionApi;
import IState = types.IState;
import opn = util.opn;

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
 * Utility function to determine whether BepInEx is enabled via the Vortex API.
 * @param state 
 * @returns True if BepInEx is enabled, false otherwise.
 */
export const isBepInExEnabled = (state: IState) =>
    getMods(state, 'enabled').some(mod => [BEPINEX_5_MOD_TYPE, BEPINEX_6_MOD_TYPE].includes(mod.type));

/**
 * Utility function to determine whether BepInEx core files are installed to disk.
 * @param state 
 * @param discovery 
 * @returns 
 */
export const isBepInExCoreFileInstalled = async (state: IState, discovery: IDiscoveryResult | undefined = getDiscovery(state)) => {
    if (!discovery?.path) return false;

    try {
        await statAsync(join(discovery.path, BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_5_CORE_DLL));
        return true;
    } catch {
        try {
            await statAsync(join(discovery.path, BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_6_CORE_DLL));
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Utility function to validate the BepInEx installation and notify the user of any issues.
 * @param api 
 */
export const validateBepInEx = async (api: IExtensionApi) => {
    if (!isBepInExEnabled(api.getState()) && !(await isBepInExCoreFileInstalled(api.getState()))) {

        const potentials = getMods(api.getState(), 'disabled').filter(mod => [BEPINEX_5_MOD_TYPE, BEPINEX_6_MOD_TYPE].includes(mod.type));
        const disabledBepInEx = potentials.length === 1 ? potentials[0] : undefined;

        api.sendNotification?.({
            id: 'bepinex-missing',
            type: 'warning',
            title: api.translate(`{{bepinex}} is ${disabledBepInEx ? 'disabled' : 'not installed'}`, TRANSLATION_OPTIONS),
            message: api.translate('{{bepinex}} is required to mod {{game}}.', TRANSLATION_OPTIONS),
            actions: [
                disabledBepInEx // if BepInEx pack is disabled, offer to enable it
                    ? { title: api.translate('Enable'), action: () => enableMods(api, true, disabledBepInEx.id) }
                    : { title: api.translate('Get {{bepinex}}', TRANSLATION_OPTIONS), action: () => opn(BEPINEX_URL) }
            ]
        });
    } else {
        api.dismissNotification?.('bepinex-missing');
    }
}
