import { join } from 'path';
import { version } from '../package.json';
import { BEPINEX_MOD_PATH, BEPINEX_URL, isBepInExInstalled, validateBepInEx } from './bepinex';
import { EXTENSION_ID, GAME_EXE, TRANSLATION_OPTIONS } from './constants';
import { QMM_MOD_PATH, validateQModManager } from './qmodmanager';
import { getDiscovery, getGameVersion, getModPath } from './utils';
import registerInstallerBepInEx from './installers/bepinex';
import registerInstallerBepInExMixed from './installers/bepinex-mixed';
import registerInstallerBepInExPatcher from './installers/bepinex-patcher';
import registerInstallerBepInExPlugin from './installers/bepinex-plugin';
import registerInstallerCustomCraft2Plugin from './installers/customcraft2-plugin';
import registerInstallerMrPurple6411AddonPack from './installers/mrpurple6411-addon-pack';
import registerInstallerQModManagerMod from './installers/qmodmanager-mod';
import registerModTypeBepInEx5 from './mod-types/bepinex-5';
import registerModTypeBepInEx6 from './mod-types/bepinex-6';
import registerModTypeBepInExMixed from './mod-types/bepinex-mixed';
import registerModTypeBepInExPatcher from './mod-types/bepinex-patcher';
import registerModTypeBepInExPlugin from './mod-types/bepinex-plugin';
import registerModTypeCustomCraft2Plugin from './mod-types/customcraft2-plugin';
import registerModTypeCustomHullPlatesPack from './mod-types/customhullplates-pack';
import registerModTypeCustomPostersPack from './mod-types/customposters-pack';
import registerModTypeQModManager4 from './mod-types/qmodmanager-4';
import registerModTypeQModManagerMod from './mod-types/qmodmanager-mod';
import { EPIC_GAME_ID } from './platforms/epic';
import { NEXUS_GAME_ID } from './platforms/nexus';
import { STEAM_GAME_ID, SteamBetaBranch, getBranch, getManifestPath } from './platforms/steam';
import { XBOX_GAME_ID, getAppExecName } from './platforms/xbox';
import { major, prerelease } from 'semver';
import store2 from 'store2';
import { fs, selectors, util } from 'vortex-api';
import { IDialogResult, IDiscoveryResult, IExtensionApi, IExtensionContext, IGame } from 'vortex-api/lib/types/api';

export const store = store2.namespace(EXTENSION_ID).namespace(`v${major(version, true)}`);
store.isFake(['alpha', 'beta', 'dev'].includes(prerelease(version)?.[0].toString() ?? ''));

export default function main(context: IExtensionContext): boolean {
    // register Subnautica with Vortex
    context.registerGame({
        id: NEXUS_GAME_ID,
        name: 'Subnautica',
        logo: 'gameart.jpg',
        mergeMods: true,
        queryModPath: getModPath,
        executable: () => GAME_EXE,
        requiredFiles: [GAME_EXE],
        environment: { SteamAPPId: STEAM_GAME_ID },
        details: {
            steamAppId: +STEAM_GAME_ID,
            epicAppId: EPIC_GAME_ID,
        },
        requiresLauncher,
        queryArgs: {
            steam: [{ id: STEAM_GAME_ID }],
            epic: [{ id: EPIC_GAME_ID }],
            xbox: [{ id: XBOX_GAME_ID }]
        },
        setup: (discovery) => setup(context.api, discovery),
        getGameVersion,
    });

    context.once(async () => {
        context.api.events.on('gamemode-activated', async (gameMode: string) => {
            if (gameMode !== NEXUS_GAME_ID) {
                return;
            }

            await gamemodeActivated(context.api);
        });

        context.api.onAsync('did-deploy', async (profileId: string) => {
            if (selectors.profileById(context.api.getState(), profileId)?.gameId !== NEXUS_GAME_ID) {
                return;
            }

            await didDeploy(context.api);
        });
    });

    registerModTypeBepInEx5(context);
    registerModTypeBepInEx6(context);
    registerModTypeQModManager4(context);
    registerModTypeBepInExPlugin(context);
    registerModTypeBepInExPatcher(context);
    registerModTypeBepInExMixed(context);
    registerModTypeQModManagerMod(context);
    registerModTypeCustomHullPlatesPack(context);
    registerModTypeCustomPostersPack(context);
    registerModTypeCustomCraft2Plugin(context);

    registerInstallerBepInEx(context);
    registerInstallerBepInExPlugin(context);
    registerInstallerBepInExPatcher(context);
    registerInstallerBepInExMixed(context);
    registerInstallerQModManagerMod(context);
    registerInstallerMrPurple6411AddonPack(context);
    registerInstallerCustomCraft2Plugin(context);

    return true;
}

/**
 * Ensures the mod directory exists and is writable
 * @param api 
 * @param discovery 
 */
const setup = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    if (discovery?.path) {
        await Promise.all([QMM_MOD_PATH, BEPINEX_MOD_PATH].map(path => fs.ensureDirWritableAsync(join(discovery.path!, path))));
        await validateBranch(api, discovery);
    }
}

const requiresLauncher: Required<IGame>['requiresLauncher'] = async (_, store) => {
    switch (store) {
        case 'steam':
            return { launcher: 'steam', addInfo: STEAM_GAME_ID };
        case 'epic':
            return { launcher: 'epic', addInfo: EPIC_GAME_ID };
        case 'xbox':
            return {
                launcher: 'xbox',
                addInfo: {
                    appId: XBOX_GAME_ID,
                    parameters: [{
                        appExecName: getAppExecName(await util.GameStoreHelper.findByAppId([XBOX_GAME_ID]))
                    }],
                }
            };
    }
}

const gamemodeActivated = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    const manifest = getManifestPath(api, discovery);

    if (manifest) {
        const controller = new AbortController();
        const signal = controller.signal;

        fs.watch(manifest, {
            persistent: false,
            signal
        }, async () => {
            await validateBranch(api);
            await Promise.all([validateBepInEx(api), validateQModManager(api)]);
        });

        api.events.once('gamemode-activated', controller.abort);
    }

    await showSubnautica2InfoDialog(api);
    await validateBranch(api, discovery);
    await Promise.all([validateBepInEx(api), validateQModManager(api)]);
}

const didDeploy = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    await validateBranch(api, discovery);
    await Promise.all([validateBepInEx(api), validateQModManager(api)]);
}

const validateBranch = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    const storedBranch = store('branch');
    const currentBranch = await getBranch(api, discovery);

    if (currentBranch !== storedBranch) {
        store('branch', currentBranch);

        api.sendNotification?.({
            id: 'subnautica-branch',
            type: 'info',
            title: api.translate('{{game}} beta branch changed', TRANSLATION_OPTIONS),
            message: api.translate(`Detected branch: {{${currentBranch}}}`, TRANSLATION_OPTIONS),
            allowSuppress: true,
        });

        if ((!storedBranch || storedBranch === 'legacy' || currentBranch === 'legacy') && await isBepInExInstalled(api)) {
            api.sendNotification?.({
                id: 'reinstall-bepinex',
                type: 'error',
                title: api.translate('Detected previous {{bepinex}} installation.', TRANSLATION_OPTIONS),
                message: api.translate(`Please reinstall {{bepinex}} after changing branches.`, TRANSLATION_OPTIONS),
            });
        }

        await setup(api, discovery);
    }

    return currentBranch;
}

const showSubnautica2InfoDialog = async (api: IExtensionApi) => {
    if (!store('suppress-subnautica-2.0-info-dialog')) {
        const branch = store('branch') as SteamBetaBranch ?? await getBranch(api);
        if (!store('branch')) store('branch', branch);

        // this is the first time the extension has loaded since updating to v3, so we should
        // show a dialog letting the user know about the changes to Subnautica and etc.
        // and inform them of branch specifics i.e. QMM is only supported on legacy, BepInEx is required for 2.0 & experimental modding, etc.
        const title = api.translate('{{game}} 2.0 {{living-large}} Update', TRANSLATION_OPTIONS);
        const bbcode = api.translate('An update to {{game}} known as the {{living-large}} update or the {{game}} 2.0 update has been released.{{br}}{{br}}' +
            'This update is incompatible with mods which were made for {{qmodmanager}}. {{bepinex}} is now required for modding moving forward.{{br}}{{br}}' +
            'If you wish to continue using mods made for {{qmodmanager}}, you must use the {{legacy}} branch of {{game}}, which is only available on {{steam}}.', TRANSLATION_OPTIONS);

        const result: IDialogResult | undefined = await api.showDialog?.('info', title, {
            bbcode,
            checkboxes: [
                {
                    id: 'suppress-subnautica-2.0-info-dialog',
                    text: api.translate('I understand, don\'t show this message again.', TRANSLATION_OPTIONS),
                    value: false
                }
            ]
        }, [
            { label: api.translate('Get {{bepinex}}', TRANSLATION_OPTIONS), action: () => util.opn(BEPINEX_URL) },
            { label: api.translate('More info', TRANSLATION_OPTIONS), action: () => util.opn('https://www.nexusmods.com/news/14813') },
            { label: api.translate('Close', TRANSLATION_OPTIONS) }
        ], 'subnautica-2.0-info-dialog');

        if (result) {
            store('suppress-subnautica-2.0-info-dialog', result.input['suppress-subnautica-2.0-info-dialog']);
        }
    }
}
