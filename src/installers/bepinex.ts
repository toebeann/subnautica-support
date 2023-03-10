import { basename, dirname, join, sep } from 'path';
import { BEPINEX_CONFIG_DIR, BEPINEX_CORE_DIR, BEPINEX_DIR, BEPINEX_MOD_PATH, isBepInExCoreFileInstalled, isBepInExModTypeInstalled } from '../bepinex';
import { TRANSLATION_OPTIONS } from '../constants';
import { QMM_DIR, isQModManagerInstalled } from '../qmodmanager';
import { BEPINEX_5_CORE_DLL } from '../mod-types/bepinex-5';
import { BEPINEX_6_CORE_DLL } from '../mod-types/bepinex-6';
import { QMM_CORE_DLL } from '../mod-types/qmodmanager-4';
import { NEXUS_GAME_ID } from '../platforms/nexus';
import { getBranch } from '../platforms/steam';
import { IExtensionApi, IExtensionContext, IInstallResult, IInstruction, TestSupported } from 'vortex-api/lib/types/api';

/**
 * BepInEx core filenames.
 */
export const BEPINEX_INJECTOR_CORE_FILES = ['0Harmony.dll', 'Mono.Cecil.dll', 'MonoMod.RuntimeDetour.dll', 'MonoMod.Utils.dll'] as const;

/**
 * Determines whether the installer is supported for the given mod files and game.
 * @param files 
 * @param gameId 
 * @returns 
 */
export const testSupported: TestSupported = async (files, gameId) => {
    const filesLowerCase = files.filter(file => !file.endsWith(sep)).map(file => file.toLowerCase());
    return {
        requiredFiles: [],
        supported: gameId === NEXUS_GAME_ID
            && filesLowerCase.some(file => file.split(sep)[0] === BEPINEX_DIR.toLowerCase())
            && !filesLowerCase.includes(join(BEPINEX_MOD_PATH, QMM_DIR, QMM_CORE_DLL).toLowerCase())
            && (filesLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_5_CORE_DLL).toLowerCase())
                || filesLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, BEPINEX_6_CORE_DLL).toLowerCase()))
            && BEPINEX_INJECTOR_CORE_FILES.every(file => filesLowerCase.includes(join(BEPINEX_DIR, BEPINEX_CORE_DIR, file).toLowerCase()))
    };
}

/**
 * Parses the given mod files into installation instructions.
 * @param api 
 * @param files 
 * @returns 
 */
export const install = async (api: IExtensionApi, files: string[]): Promise<IInstallResult> => {
    api.dismissNotification?.('bepinex-missing');
    api.dismissNotification?.('reinstall-bepinex');

    const legacyConfig = files.find(file => basename(file).toLowerCase() === 'bepinex.legacy.cfg'
        && basename(dirname(file)).toLowerCase() === BEPINEX_CONFIG_DIR.toLowerCase());
    const stableConfig = files.find(file => basename(file).toLowerCase() === 'bepinex.cfg'
        && basename(dirname(file)).toLowerCase() === BEPINEX_CONFIG_DIR.toLowerCase());

    const branch = await getBranch(api);

    if (branch === 'legacy') {
        if (isQModManagerInstalled(api)
            && !isBepInExModTypeInstalled(api)
            && (await isBepInExCoreFileInstalled(api))) {

            api.sendNotification?.({
                id: 'reinstall-qmm',
                type: 'error',
                title: api.translate('Incompatible {{qmodmanager}} installation detected.', TRANSLATION_OPTIONS),
                message: api.translate('Please reinstall {{qmodmanager}} before installing {{bepinex}}.', TRANSLATION_OPTIONS),
            });

            return {
                instructions: []
            }
        }
    }
    

    return {
        instructions: [
            ...files.filter(file => !file.endsWith(sep)).map((source): IInstruction => {
                let destination = source;

                if (branch === 'legacy') {
                    if (source === legacyConfig) {
                        const dir = dirname(source);
                        const file = basename(source).split('.').filter(x => x !== branch).join('.');
                        destination = join(dir, file);
                    } else if (source === stableConfig) {
                        const dir = dirname(source);
                        const file = basename(source).split('.');
                        file.splice(file.length - 1, 0, 'stable');
                        destination = join(dir, file.join('.'));
                    }
                }

                return {
                    type: 'copy',
                    source,
                    destination
                }
            }).filter(instruction => instruction.destination !== stableConfig || branch !== 'legacy' || (legacyConfig && instruction.source === legacyConfig))
        ]
    }
}

/**
 * Registers the BepInEx installer with the Vortex API.
 * @param context 
 * @returns 
 */
export const register = (context: IExtensionContext) => context.registerInstaller('bepinex', 50, testSupported, (files) => install(context.api, files));
export default register;
