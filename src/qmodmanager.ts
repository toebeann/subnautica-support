/**
 * Subnautica Support - Vortex support for Subnautica
 * Copyright (C) 2023 Tobey Blaber
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, see <https://www.gnu.org/licenses>.
 */
import { store } from '.';
import { TRANSLATION_OPTIONS } from './constants';
import { enableMods, getMods } from './utils';
import { QMM_4_MOD_TYPE } from './mod-types/qmodmanager-4';
import { QMM_MOD_MOD_TYPE } from './mod-types/qmodmanager-mod';
import { SteamBetaBranch } from './platforms/steam';
import { types, util } from 'vortex-api';
import IExtensionApi = types.IExtensionApi;
import IState = types.IState;
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
export const QMM_MOD_DIR = 'QMods';

/**
 * Utility function to determine whether QModManager is enabled via the Vortex API.
 * @param state 
 * @returns True if QModManager is enabled, false otherwise.
 */
export const isQModManagerEnabled = (state: IState) =>
    getMods(state, 'enabled').some(mod =>
        mod.attributes?.homepage === QMM_URL ||
        (mod.attributes?.modId === 201 && mod.attributes?.downloadGame === 'subnautica') ||
        mod.type === QMM_4_MOD_TYPE);

/**
 * Utility function to determing whether any QMods are enabled via the Vortex API.
 * @param state 
 * @returns True if any QMods are installed, false otherwise. Always returns false is no QMods were installed and enabled via Vortex.
 */
export const areAnyQModsEnabled = (state: IState) => getMods(state, 'enabled').some(mod => mod.type === QMM_MOD_MOD_TYPE);

/**
 * Utility function to validate the QModManager installation and notify the user of any issues.
 * @param api 
 */
export const validateQModManager = async (api: IExtensionApi) => {
    switch (store('branch') as SteamBetaBranch) {
        case 'legacy':
            if (!isQModManagerEnabled(api.getState()) && areAnyQModsEnabled(api.getState())) {
                // user has QMods enabled but has not installed/enabled QModManager

                api.dismissNotification?.('qmodmanager-stable');

                const potentials = getMods(api.getState(), 'disabled').filter(mod => mod.type === QMM_4_MOD_TYPE);
                const disabledQmm = potentials.length === 1 ? potentials[0] : undefined;

                api.sendNotification?.({
                    id: 'qmodmanager-missing',
                    type: 'warning',
                    title: api.translate(`{{qmodmanager}} is ${disabledQmm ? 'disabled' : 'not installed'}`, TRANSLATION_OPTIONS),
                    message: api.translate('{{qmodmanager}} is required to use {{qmods}}.', TRANSLATION_OPTIONS),
                    actions: [
                        disabledQmm // if QMM is disabled, offer to enable it
                            ? { title: api.translate('Enable'), action: () => enableMods(api, true, disabledQmm.id) }
                            : { title: api.translate('Get {{qmm}}', TRANSLATION_OPTIONS), action: () => opn(QMM_URL) }
                    ]
                });
            } else {
                api.dismissNotification?.('qmodmanager-missing');
                api.dismissNotification?.('qmodmanager-stable');
            }
            break;
        default:
            api.dismissNotification?.('qmodmanager-missing');

            if (isQModManagerEnabled(api.getState())) {
                // user has QModManager enabled but is not on the legacy branch

                const potentials = getMods(api.getState(), 'enabled').filter(mod => mod.type === QMM_4_MOD_TYPE);
                console.log(potentials);
                const enabledQmm = potentials.length === 1 ? potentials[0] : undefined;

                api.sendNotification?.({
                    id: 'qmodmanager-stable',
                    type: 'error',
                    title: api.translate('Disable {{qmm}} or switch to {{legacy}} branch', TRANSLATION_OPTIONS),
                    message: api.translate('Using {{qmodmanager}} may cause issues.', TRANSLATION_OPTIONS),
                    allowSuppress: true,
                    actions: enabledQmm // if QMM is enabled, offer to disable it
                        ? [{ title: api.translate('Disable'), action: () => enableMods(api, false, enabledQmm.id) }]
                        : undefined
                });
            } else {
                api.dismissNotification?.('qmodmanager-stable');
            }
            break;
    }
}
