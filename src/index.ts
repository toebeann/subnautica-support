import { basename, dirname, join, sep } from 'path';
import rjson from 'relaxed-json';
import { log, fs, types, util } from 'vortex-api';

const GAME_EXE = 'Subnautica.exe';

// Nexus Mods and game store IDs
const SUBNAUTICA_ID = 'subnautica';
const STEAMAPP_ID = '264710';
const EPICAPP_ID = 'Jaguar';
const XBOX_ID = 'UnknownWorldsEntertainmen.GAMEPREVIEWSubnautica';

// Mod install values
const QMM_MODPAGE = 'https://www.nexusmods.com/subnautica/mods/201';
const QMM_DLL = 'QModInstaller.dll';
const QMM_MOD_FILE = 'mod.json'; // QMM mods must include a mod.json
const ADDON_FILE = 'info.json'; // CustomHullPlates and Posters addons must include an info.json
const CC2_FOLDER = 'CustomCraft2SML'; // CustomCraft2 mods should be packaged within a CustomCraft2SML folder
// const BIX_FOLDER = 'BepInEx'; // BepInEx plugins & patchers should be packaged within a BepInEx folder

export default function main(context: types.IExtensionContext): boolean {
    context.requireExtension('modtype-bepinex');

    // register Subnautica with Vortex
    context.registerGame({
        id: SUBNAUTICA_ID,
        name: 'Subnautica',
        logo: 'gameart.jpg',
        mergeMods: true,
        queryModPath: () => 'QMods',
        executable: () => GAME_EXE,
        requiredFiles: [GAME_EXE],
        environment: {
            SteamAPPId: STEAMAPP_ID
        },
        details: {
            steamAppId: parseInt(STEAMAPP_ID),
            epicAppId: EPICAPP_ID
        },
        requiresLauncher: requiresEpicLauncher,
        queryPath: findGame,
        setup: (discovery) => prepareForModding(discovery, context.api),
    });

    context.registerInstaller('subnautica-qmm-installer', 25, testQMM, files => installQMM(files, context.api));
    context.registerInstaller('subnautica-qmm-mod-installer', 25, testQMMMod, installQMMMod);
    context.registerInstaller('subnautica-addon-installer', 25, testAddon, installAddon);
    context.registerInstaller('subnautica-cc2-mod-installer', 25, testCC2Mod, installCC2Mod);
    context.registerInstaller('bepinex-root-installer', 25, testBIXRoot, installBIXRoot);

    context.once(() => {
        if (context.api.ext.bepinexAddGame !== undefined) {
            context.api.ext.bepinexAddGame({
                gameId: SUBNAUTICA_ID,
                autoDownloadBepInEx: true,
                customPackDownloader: () => {
                    return {
                        gameId: SUBNAUTICA_ID,
                        domainId: SUBNAUTICA_ID,
                        modId: '1108',
                        fileId: '4269',
                        archiveName: 'BepInEx_x64_5.4.21.0.zip',
                        allowAutoInstall: false
                    };
                }
            });
        }
    });

    return true;
}

async function requiresEpicLauncher(): ReturnType<Required<types.IGame>['requiresLauncher']> {
    if (await util.GameStoreHelper.isGameInstalled(EPICAPP_ID, 'epic')) {
        return { launcher: 'epic', addInfo: EPICAPP_ID };
    }
}

async function findGame(): Promise<string> {
    return (await util.GameStoreHelper.findByAppId([STEAMAPP_ID, EPICAPP_ID, XBOX_ID])).gamePath;
}

async function prepareForModding(discovery: types.IDiscoveryResult, api: types.IExtensionApi) {
    const basePath = discovery.path ?? '';
    const qmodsPath = join(basePath, 'QMods');
    await fs.ensureDirWritableAsync(qmodsPath);

    const qmmPath = join(basePath, 'BepInEx', 'plugins', 'QModManager', QMM_DLL);
    await checkForQMM(api, qmmPath);
}

async function checkForQMM(api: types.IExtensionApi, qmmPath: string) {
    try {
        await fs.statAsync(qmmPath);
    } catch {
        api.sendNotification?.({
            id: 'qmm-missing',
            type: 'warning',
            title: 'QModManager not installed',
            message: 'QModManager is required to mod Subnautica.',
            actions: [{
                title: 'Get QModManager',
                action: async () => { try { await util.opn(QMM_MODPAGE); } catch { } }
            }]
        })
    }
}

async function testBIXRoot(files: string[], gameId: string): Promise<types.ISupportedResult> {
    return {
        supported: gameId === SUBNAUTICA_ID && files.some(file => file.split(sep)[0] === 'BepInEx'),
        requiredFiles: []
    }
}

async function installBIXRoot(files: string[]): Promise<types.IInstallResult> {
    return {
        instructions: [
            ...files
                .filter(file => !file.endsWith(sep)) // filter out directories
                .map((file): types.IInstruction => {
                    return {
                        type: 'copy',
                        source: file,
                        destination: file
                    };
                }),
            {
                type: 'setmodtype',
                value: 'dinput'
            }
        ]
    }
}

async function testQMM(files: string[], gameId: string): Promise<types.ISupportedResult> {
    return {
        supported: gameId === SUBNAUTICA_ID && files.some(file => basename(file).toLowerCase() === QMM_DLL.toLowerCase()),
        requiredFiles: []
    };
}

async function installQMM(files: string[], api: types.IExtensionApi): Promise<types.IInstallResult> {
    api.dismissNotification?.('qmm-missing');

    return {
        instructions: [
            ...files
                .filter(file => !file.endsWith(sep)) // filter out directories
                .map((file): types.IInstruction => {
                    return {
                        type: 'copy',
                        source: file,
                        destination: file
                    };
                }),
            {
                type: 'setmodtype',
                value: 'dinput' // set mod type as dinput so the files are installed to the game root folder
            }
        ]
    };
}

async function testQMMMod(files: string[], gameId: string): Promise<types.ISupportedResult> {
    const modFiles = files.filter(file => basename(file).toLowerCase() === QMM_MOD_FILE);
    if (modFiles.length > 1) {
        log('error', 'Archive contains multiple mods and is not supported', modFiles);
    }

    return {
        supported: gameId === SUBNAUTICA_ID && modFiles.length === 1,
        requiredFiles: []
    };
}

async function installQMMMod(files: string[], destinationPath: string): Promise<types.IInstallResult> {
    const modFile = files.find(file => basename(file).toLowerCase() === QMM_MOD_FILE);

    if (!modFile) {
        throw new util.DataInvalid('Not a QModManager mod.');
    }

    const rootPath = dirname(modFile);
    const name = await getQMMModName(modFile, destinationPath);
    const index = modFile.indexOf(QMM_MOD_FILE);

    return {
        instructions: files.filter(file => !file.endsWith(sep) && file.indexOf(rootPath) !== 1).map((file): types.IInstruction => {
            return {
                type: 'copy',
                source: file,
                destination: join(name, file.substring(index))
            };
        })
    };
}

async function getQMMModName(modFile: string, destinationPath: string): Promise<string> {
    const folder = basename(dirname(modFile));

    if (folder !== '.') {
        return folder;
    }

    try {
        const path = join(destinationPath, modFile);
        const data = rjson.parse(util.deBOM(await fs.readFileAsync(path, { encoding: 'utf-8' }))) as { Id: string };
        return data.Id;
    } catch {
        throw new util.DataInvalid(`Failed to parse ${QMM_MOD_FILE}.`);
    }
}

async function testAddon(files: string[], gameId: string): Promise<types.ISupportedResult> {
    return {
        supported: gameId === SUBNAUTICA_ID && files.some(file => basename(file).toLowerCase() === ADDON_FILE),
        requiredFiles: []
    };
}

async function installAddon(files: string[], destinationPath: string): Promise<types.IInstallResult> {
    const addonFiles = files.filter(file => basename(file).toLowerCase() === ADDON_FILE);

    if (addonFiles.length < 1) {
        throw new util.DataInvalid('No addons found in archive.');
    }

    return {
        instructions: (await Promise.all(addonFiles.map(async (addonFile) => {
            const parentFolder = dirname(addonFile);
            const addonFolder = await getAddonFolder(addonFile, destinationPath);
            const index = addonFile.indexOf(ADDON_FILE);

            return files.filter(file => !file.endsWith(sep) && file.startsWith(parentFolder)).map((file): types.IInstruction => {
                return {
                    type: 'copy',
                    source: file,
                    destination: join(addonFolder, basename(parentFolder), file.substring(index))
                }
            });
        }))).flat()
    };
}

async function getAddonFolder(addonFile: string, destinationPath: string): Promise<string> {
    try {
        const path = join(destinationPath, addonFile);
        const data = rjson.parse(util.deBOM(await fs.readFileAsync(path, { encoding: 'utf-8' }))) as { Orientation: string }

        return !!data.Orientation
            ? join('CustomPosters', 'Posters')
            : join('CustomHullPlates', 'HullPlates');
    } catch {
        throw new util.DataInvalid(`Failed to parse ${ADDON_FILE}.`);
    }
}

async function testCC2Mod(files: string[], gameId: string): Promise<types.ISupportedResult> {
    return {
        supported: gameId === SUBNAUTICA_ID && files.some(file => file.endsWith(`${CC2_FOLDER}${sep}`)),
        requiredFiles: []
    };
}

async function installCC2Mod(files: string[]): Promise<types.IInstallResult> {
    const cc2Folder = files.find(file => file.endsWith(`${CC2_FOLDER}${sep}`));

    if (!cc2Folder) {
        throw new util.DataInvalid('Unrecognised or invalid Subnautica mod.');
    }

    const index = cc2Folder.indexOf(CC2_FOLDER);

    return {
        instructions: files.filter(file => !file.endsWith(sep) && file.includes(CC2_FOLDER)).map((file): types.IInstruction => {
            return {
                type: 'copy',
                source: file,
                destination: file.substring(index)
            }
        })
    }
}
