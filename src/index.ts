import { EXTENSION_ID, GAME_EXE } from './constants';
import { getDiscovery, getGameVersion, getModPath, getMods } from './utils';
import registerInstallerBepInEx from './installers/bepinex';
import registerInstallerBepInExMixed from './installers/bepinex-mixed';
import registerInstallerBepInExPatcher from './installers/bepinex-patcher';
import registerInstallerBepInExPlugin from './installers/bepinex-plugin';
import registerInstallerQModManager from './installers/qmodmanager';
import registerModTypeBepInEx5 from './mod-types/bepinex-5';
import registerModTypeBepInEx6 from './mod-types/bepinex-6';
import registerModTypeBepInExMixed from './mod-types/bepinex-mixed';
import registerModTypeBepInExPatcher from './mod-types/bepinex-patcher';
import registerModTypeBepInExPlugin from './mod-types/bepinex-plugin';
import registerModTypeQModManager4 from './mod-types/qmodmanager-4';
import { EPIC_GAME_ID } from './platforms/epic';
import { NEXUS_GAME_ID } from './platforms/nexus';
import { STEAM_GAME_ID, getBranch } from './platforms/steam';
import { XBOX_GAME_ID, getAppExecName } from './platforms/xbox';
import store2 from 'store2';
import { fs, selectors, util } from 'vortex-api';
import { IDialogResult, IDiscoveryResult, IExtensionApi, IExtensionContext, IGame } from 'vortex-api/lib/types/api';

export const store = store2.namespace(EXTENSION_ID);
store.isFake(true); // TODO: remove this when finished testing

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

    // TODO: register installers and modtypes
    registerModTypeBepInEx5(context);
    registerModTypeBepInEx6(context);
    registerModTypeQModManager4(context);
    registerModTypeBepInExPlugin(context);
    registerModTypeBepInExPatcher(context);
    registerModTypeBepInExMixed(context);
    // TODO: register mod types for QMM mods, QMM addons and CC2 mods

    registerInstallerBepInEx(context);
    registerInstallerQModManager(context);
    registerInstallerBepInExPlugin(context);
    registerInstallerBepInExPatcher(context);
    registerInstallerBepInExMixed(context);
    // TODO: register installers for QMM mods, QMM addons and CC2 mods

    return true;
}

/**
 * Ensures the mod directory exists and is writable
 * @param api 
 * @param discovery 
 */
const setup = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    if (discovery?.path) {
        await validateBranch(api, discovery);
        const modPath = getModPath(discovery.path);
        await fs.ensureDirWritableAsync(modPath);
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
    await showSubnautica2InfoDialog(api);
    await validateBranch(api, discovery);
    // TODO: validate QMM & BepInEx and warn user if appropriate
}

const didDeploy = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    await validateBranch(api, discovery);
    // TODO: validate QMM & BepInEx and warn user if appropriate
}

const validateBranch = async (api: IExtensionApi, discovery: IDiscoveryResult | undefined = getDiscovery(api)) => {
    const storedBranch = store('branch');
    const currentBranch = await getBranch(api, discovery);

    if (currentBranch !== storedBranch) {
        store('branch', currentBranch);

        api.sendNotification?.({
            id: 'subnautica-branch',
            type: 'info',
            message: api.translate(`Detected Subnautica branch: ${currentBranch}`),
            allowSuppress: true,
            // TODO: add action to open dialog for more information
        });

        await api.showDialog?.('info', 'Subnautica Mods', {
            text: JSON.stringify(getMods(api).map(mod => {
                return { type: mod.type, name: mod.attributes?.['modName'] ?? mod.attributes?.['name'] };
            }), null, 2)
        }, [{ label: 'OK' }]);

        await setup(api, discovery);
    }
}

const showSubnautica2InfoDialog = async (api: IExtensionApi) => {
    if (!store('suppress-subnautica-2.0-info-dialog')) {
        await validateBranch(api);
        const branch = store('branch');

        // this is the first time the extension has loaded since updating to v3, so we should
        // show a dialog letting the user know about the changes to Subnautica and etc.
        // and inform them of branch specifics i.e. QMM is only supported on legacy, BepInEx is required for 2.0 & experimental modding, etc.
        // TODO: show dialog as above ^
        const result: IDialogResult | undefined = await api.showDialog?.('info', 'Subnautica 2.0 Living Large Update', {
            bbcode: `Subnautica has been updated to version 2.0, which includes a new game engine and a new modding system.
                    This update is not backwards compatible with mods for the previous version of Subnautica, so you will need to update your mods to work with the new version of Subnautica.
                    You can find more information about the update and the new modding system [url=https://subnautica.fandom.com/wiki/Modding]here[/url].`,
            checkboxes: [
                {
                    id: 'suppress-subnautica-2.0-info-dialog',
                    text: 'I understand, don\'t show this message again.',
                    value: false
                }
            ]
        }, [{ label: 'Close' }], 'subnautica-2.0-info-dialog');

        if (result) {
            store('suppress-subnautica-2.0-info-dialog', result.input['suppress-subnautica-2.0-info-dialog']);
        }
    }
}

// async function testQMMMod(files: string[], gameId: string): Promise<types.ISupportedResult> {
//     const modFiles = files.filter(file => basename(file).toLowerCase() === QMM_MOD_FILE);
//     if (modFiles.length > 1) {
//         log('error', 'Archive contains multiple mods and is not supported', modFiles);
//     }

//     return {
//         supported: gameId === SUBNAUTICA_ID && modFiles.length === 1,
//         requiredFiles: []
//     };
// }

// async function installQMMMod(files: string[], destinationPath: string): Promise<types.IInstallResult> {
//     const modFile = files.find(file => basename(file).toLowerCase() === QMM_MOD_FILE);

//     if (!modFile) {
//         throw new util.DataInvalid('Not a QModManager mod.');
//     }

//     const rootPath = dirname(modFile);
//     const name = await getQMMModName(modFile, destinationPath);
//     const index = modFile.indexOf(QMM_MOD_FILE);

//     return {
//         instructions: files.filter(file => !file.endsWith(sep) && file.indexOf(rootPath) !== 1).map((file): types.IInstruction => {
//             return {
//                 type: 'copy',
//                 source: file,
//                 destination: join(name, file.substring(index))
//             };
//         })
//     };
// }

// async function getQMMModName(modFile: string, destinationPath: string): Promise<string> {
//     const folder = basename(dirname(modFile));

//     if (folder !== '.') {
//         return folder;
//     }

//     try {
//         const path = join(destinationPath, modFile);
//         const data = rjson.parse(util.deBOM(await fs.readFileAsync(path, { encoding: 'utf-8' }))) as { Id: string };
//         return data.Id;
//     } catch {
//         throw new util.DataInvalid(`Failed to parse ${QMM_MOD_FILE}.`);
//     }
// }

// async function testAddon(files: string[], gameId: string): Promise<types.ISupportedResult> {
//     return {
//         supported: gameId === SUBNAUTICA_ID && files.some(file => basename(file).toLowerCase() === ADDON_FILE),
//         requiredFiles: []
//     };
// }

// async function installAddon(files: string[], destinationPath: string): Promise<types.IInstallResult> {
//     const addonFiles = files.filter(file => basename(file).toLowerCase() === ADDON_FILE);

//     if (addonFiles.length < 1) {
//         throw new util.DataInvalid('No addons found in archive.');
//     }

//     return {
//         instructions: (await Promise.all(addonFiles.map(async (addonFile) => {
//             const parentFolder = dirname(addonFile);
//             const addonFolder = await getAddonFolder(addonFile, destinationPath);
//             const index = addonFile.indexOf(ADDON_FILE);

//             return files.filter(file => !file.endsWith(sep) && file.startsWith(parentFolder)).map((file): types.IInstruction => {
//                 return {
//                     type: 'copy',
//                     source: file,
//                     destination: join(addonFolder, basename(parentFolder), file.substring(index))
//                 }
//             });
//         }))).flat()
//     };
// }

// async function getAddonFolder(addonFile: string, destinationPath: string): Promise<string> {
//     try {
//         const path = join(destinationPath, addonFile);
//         const data = rjson.parse(util.deBOM(await fs.readFileAsync(path, { encoding: 'utf-8' }))) as { Orientation: string }

//         return !!data.Orientation
//             ? join('CustomPosters', 'Posters')
//             : join('CustomHullPlates', 'HullPlates');
//     } catch {
//         throw new util.DataInvalid(`Failed to parse ${ADDON_FILE}.`);
//     }
// }

// async function testCC2Mod(files: string[], gameId: string): Promise<types.ISupportedResult> {
//     return {
//         supported: gameId === SUBNAUTICA_ID && files.some(file => file.endsWith(`${CC2_FOLDER}${sep}`)),
//         requiredFiles: []
//     };
// }

// async function installCC2Mod(files: string[]): Promise<types.IInstallResult> {
//     const cc2Folder = files.find(file => file.endsWith(`${CC2_FOLDER}${sep}`));

//     if (!cc2Folder) {
//         throw new util.DataInvalid('Unrecognised or invalid Subnautica mod.');
//     }

//     const index = cc2Folder.indexOf(CC2_FOLDER);

//     return {
//         instructions: files.filter(file => !file.endsWith(sep) && file.includes(CC2_FOLDER)).map((file): types.IInstruction => {
//             return {
//                 type: 'copy',
//                 source: file,
//                 destination: file.substring(index)
//             }
//         })
//     }
// }
