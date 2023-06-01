import '@total-typescript/ts-reset';
import { join } from 'path';
import { version } from '../package.json';
import { BEPINEX_CONFIG_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH, BEPINEX_URL, validateBepInEx } from './bepinex';
import { EXTENSION_ID, GAME_EXE, GAME_NAME, TRANSLATION_OPTIONS, UNITY_PLAYER } from './constants';
import { QMM_MOD_PATH, validateQModManager } from './qmodmanager';
import { getDiscovery, getModPath, getMods, isFile, reinstallMod } from './utils';
import registerInstallerBepInEx from './installers/bepinex';
import registerInstallerBepInExMixed from './installers/bepinex-mixed';
import registerInstallerBepInExPatcher from './installers/bepinex-patcher';
import registerInstallerBepInExPlugin from './installers/bepinex-plugin';
import registerInstallerCustomCraft2Plugin from './installers/customcraft2-plugin';
import registerInstallerMrPurple6411AddonPack from './installers/mrpurple6411-addon-pack';
import registerModTypeBepInEx5, { BEPINEX_5_MOD_TYPE } from './mod-types/bepinex-5';
import registerModTypeBepInEx6, { BEPINEX_6_MOD_TYPE } from './mod-types/bepinex-6';
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
import { getFileVersion, getProductVersion } from 'exe-version';
import { major, prerelease } from 'semver';
import store2 from 'store2';
import { actions, fs, selectors, types, util } from 'vortex-api';
import { z } from 'zod';
import readFileAsync = fs.readFileAsync;
import ensureDirWritableAsync = fs.ensureDirWritableAsync;
import watch = fs.watch;
import installPathForGame = selectors.installPathForGame;
import profileById = selectors.profileById;
import IDialogResult = types.IDialogResult;
import IDiscoveryResult = types.IDiscoveryResult;
import IExtensionApi = types.IExtensionApi;
import IExtensionContext = types.IExtensionContext;
import IGame = types.IGame;
import GameStoreHelper = util.GameStoreHelper;
import opn = util.opn;

export const store = store2.namespace(EXTENSION_ID).namespace(`v${major(version, true)}`);
store.isFake(prerelease(version, true)?.[0].toString() === 'dev');

export default function main(context: IExtensionContext): boolean {
    if (store.isFake()) {
        debugSetup(context);
    }

    // register Subnautica with Vortex
    context.registerGame({
        id: NEXUS_GAME_ID,
        name: GAME_NAME,
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
        getGameVersion: async (gamePath) => {
            const versionParser = z.string().min(0);
            try {
                const plasticStatusPath = join(gamePath, 'Subnautica_Data', 'StreamingAssets', 'SNUnmanagedData', 'plastic_status.ignore');
                return versionParser.parse((await readFileAsync(plasticStatusPath, { encoding: 'utf8' })).trim());
            } catch {
                const exePath = join(gamePath, GAME_EXE);
                try {
                    return versionParser.parse((await getProductVersion(exePath)).trim());
                } catch {
                    const playerPath = join(gamePath, UNITY_PLAYER);
                    try {
                        return versionParser.parse((await getProductVersion(playerPath)).trim());
                    } catch {
                        try {
                            return versionParser.parse((await getFileVersion(exePath)).trim());
                        } catch {
                            try {
                                return versionParser.parse((await getFileVersion(playerPath)).trim());
                            } catch {
                                return 'Unknown';
                            }
                        }
                    }
                }
            }
        }
    });

    context.once(async () => {
        context.api.events.on('gamemode-activated', async (gameMode: string) => {
            if (gameMode !== NEXUS_GAME_ID) {
                return;
            }

            await gamemodeActivated(context.api);
        });

        context.api.onAsync('did-deploy', async (profileId: string) => {
            if (profileById(context.api.getState(), profileId)?.gameId !== NEXUS_GAME_ID) {
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
    registerInstallerMrPurple6411AddonPack(context);
    registerInstallerCustomCraft2Plugin(context);

    return true;
}

const debugSetup = (context: IExtensionContext) => {
    Object.assign(globalThis, {
        toebean: {
            sn1: {
                context,
                getState: () => context.api.getState(),
                getDiscovery: () => getDiscovery(context.api.getState()),
                getMods: () => getMods(context.api.getState()),
                'vortex-api': {
                    actions,
                    selectors,
                    types,
                    util,
                },
            }
        }
    })
}

/**
 * Ensures the mod directory exists and is writable
 * @param api 
 * @param discovery 
 */
const setup = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api.getState())) => {
    if (discovery?.path) {
        await Promise.all([QMM_MOD_PATH, BEPINEX_MOD_PATH].map(path => ensureDirWritableAsync(join(discovery.path!, path))));
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
                        appExecName: getAppExecName(await GameStoreHelper.findByAppId([XBOX_GAME_ID]))
                    }],
                }
            };
    }
}

const gamemodeActivated = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api.getState())) => {
    const manifest = getManifestPath(api.getState(), discovery);

    if (manifest) {
        const controller = new AbortController();
        const signal = controller.signal;

        watch(manifest, {
            persistent: false,
            signal
        }, async () => {
            await validateBranch(api);
            await Promise.all([validateBepInEx(api), validateQModManager(api)]);
        });

        api.events.once('gamemode-activated', () => controller.abort());
    }

    await showSubnautica2InfoDialog(api);
    await validateBranch(api, discovery);
    await Promise.all([validateBepInEx(api), validateQModManager(api)]);
}

const didDeploy = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api.getState())) => {
    await validateBranch(api, discovery);
    await Promise.all([validateBepInEx(api), validateQModManager(api)]);
}

const validateBranch = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api.getState())) => {
    const storedBranch = store('branch');
    const currentBranch = await getBranch(api.getState(), discovery);

    if (currentBranch !== storedBranch) {
        store('branch', currentBranch);

        api.sendNotification?.({
            id: 'subnautica-branch',
            type: 'info',
            title: api.translate('{{game}} beta branch changed', TRANSLATION_OPTIONS),
            message: api.translate(`Detected branch: {{${currentBranch}}}`, TRANSLATION_OPTIONS),
            allowSuppress: true,
        });

        const bepinexPacks = getMods(api.getState(), 'enabled').filter(mod => [BEPINEX_5_MOD_TYPE, BEPINEX_6_MOD_TYPE].includes(mod.type));
        const stagingFolder = installPathForGame(api.getState(), NEXUS_GAME_ID);
        if ((!storedBranch || storedBranch === 'legacy' || currentBranch === 'legacy') && // branch has changed
            bepinexPacks.length > 0 && // bepinex pack is installed
            (bepinexPacks.length > 1 || // save my sanity from attempting to work out what to do when they have multiple bepinex packs installed...
                await isFile(join(stagingFolder, bepinexPacks[0].installationPath, BEPINEX_DIR, BEPINEX_CONFIG_DIR, `BepInEx.${currentBranch === 'legacy' ? 'legacy' : 'stable'}.cfg`)))) {

            // if there is an alt config file in the staging folder, it's an old version of the bepinex pack which requires reinstalling when branch is changed

            const potentials = getMods(api.getState(), 'enabled').filter(mod => [BEPINEX_5_MOD_TYPE, BEPINEX_6_MOD_TYPE].includes(mod.type));
            const bepinex = potentials.length === 1 ? potentials[0] : undefined;

            api.sendNotification?.({
                id: 'reinstall-bepinex',
                type: 'error',
                title: api.translate('{{bepinex}} config file update needed', TRANSLATION_OPTIONS),
                message: api.translate(`Please reinstall {{bepinex}} to apply update.`, TRANSLATION_OPTIONS),
                actions: [
                    bepinex // if BepInEx pack is enabled, offer to reinstall it
                        ? { title: api.translate('Reinstall'), action: () => reinstallMod(api, bepinex) }
                        : { title: api.translate('Get {{bepinex}}', TRANSLATION_OPTIONS), action: () => opn(BEPINEX_URL) }
                ],
            });
        } else {
            api.dismissNotification?.('reinstall-bepinex');
        }

        if (currentBranch !== 'legacy') {
            api.dismissNotification?.('reinstall-qmm');
        }

        await setup(api, discovery);
    }

    return currentBranch;
}

const showSubnautica2InfoDialog = async (api: IExtensionApi) => {
    if (!store('suppress-subnautica-2.0-info-dialog')) {
        const branch = store('branch') as SteamBetaBranch ?? await getBranch(api.getState());
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
            { label: api.translate('Get {{bepinex}}', TRANSLATION_OPTIONS), action: () => opn(BEPINEX_URL) },
            { label: api.translate('More', TRANSLATION_OPTIONS), action: () => opn('https://www.nexusmods.com/news/14813') },
            { label: api.translate('Close', TRANSLATION_OPTIONS) }
        ], 'subnautica-2.0-info-dialog');

        if (result) {
            store('suppress-subnautica-2.0-info-dialog', result.input['suppress-subnautica-2.0-info-dialog']);
        }
    }
}
