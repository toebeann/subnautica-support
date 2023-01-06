import { IGameStoreEntry } from 'vortex-api/lib/types/IGameStoreEntry';

/**
 * Xbox game id for Subnautica
 */
export const XBOX_GAME_ID = 'UnknownWorldsEntertainmen.GAMEPREVIEWSubnautica';

/**
 * Xbox app executable name used to launch the game
 */
export const XBOX_APP_EXEC_NAME = 'App';

/**
 * Gets the Xbox app executable name used to launch the game
 * @param gameStoreEntry 
 * @returns The Xbox app executable name used to launch the game
 */
export const getAppExecName = (gameStoreEntry: IGameStoreEntry) =>
    'executionName' in gameStoreEntry && typeof gameStoreEntry.executionName === 'string'
        ? gameStoreEntry.executionName
        : XBOX_APP_EXEC_NAME;
