/**
 * Internal extension id used for namespacing of session/localStorage keys.
 */
export const EXTENSION_ID = 'me.tobey.vortex.subnautica-support';

/**
 * Name of the game.
 */
export const GAME_NAME = 'Subnautica';

/**
 * Path to the Subnautica game executable relative to the game directory.
 */
export const GAME_EXE = 'Subnautica.exe';

/**
 * Path to the Unity Player assembly relative to the game directory.
 */
export const UNITY_PLAYER = 'UnityPlayer.dll';

/**
 * Options for Vortex translation API.
 */
export const TRANSLATION_OPTIONS = {
    /**
     * Replacement strings for Vortex translation API.
     */
    replace: {
        game: GAME_NAME,
        bepinex: 'BepInEx',
        plugins: 'plugins',
        patchers: 'patchers',
        qmodmanager: 'QModManager',
        qmm: 'QMM',
        qmods: 'QMods',
        legacy: 'legacy',
        stable: 'stable',
        steam: 'Steam',
        experimental: 'experimental',
        'living-large': 'Living Large',
        'br': '<br/>',
    },
} as const;
