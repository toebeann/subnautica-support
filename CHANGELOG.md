# Changelog

## [3.3.0] - 2023-06-01

### Changed

- Change license from LGPL-3.0 to GPL-3.0 ([`68cdeae`](https://github.com/toebeann/subnautica-support/commit/68cdeae))
- Only notify user to install QModManager on the legacy branch if user has at least one QMod enabled ([`4e65feb`](https://github.com/toebeann/subnautica-support/commit/4e65feb))
- Offer to reinstall the BepInEx pack when necessary rather than just notifying the user that it needs to be reinstalled ([`a67aefd`](https://github.com/toebeann/subnautica-support/commit/a67aefd))
- Offer to reinstall QModManager when necessary rather than just notifying the user that it needs to be reinstalled ([`a67aefd`](https://github.com/toebeann/subnautica-support/commit/a67aefd))

### Added

- Offer to enable the BepInEx pack when it is detected as disabled ([`e76d4d2`](https://github.com/toebeann/subnautica-support/commit/e76d4d2))
- Offer to enable QModManager on the legacy branch when it is detected as disabled and the user has at least one QMod enabled ([`4e65feb`](https://github.com/toebeann/subnautica-support/commit/4e65feb))
- Offer to disable QModManager when not on the legacy branch ([`4e65feb`](https://github.com/toebeann/subnautica-support/commit/4e65feb))
- Add a changelog GUI to automatically let users know about updates ([`e65919e`](https://github.com/toebeann/subnautica-support/commit/e65919e))

### Removed

- Drop support for Vortex versions older than 1.8.0
- Stop notifying users to reinstall BepInEx pack when changing to/from the legacy branch if reinstalling it would not update the `BepInEx.cfg` file ([`88684dd`](https://github.com/toebeann/subnautica-support/commit/88684dd))

### Fixed

- Correct handling of `BepInEx.cfg` on legacy branch for BepInEx pack version 5.4.21-payload.1.4.0 or newer ([`738f485`](https://github.com/toebeann/subnautica-support/commit/738f485))

## [3.2.8] - 2023-02-12

_This release comprises miscellaneous maintenance changes only._

## [3.2.7] - 2023-02-10

### Fixed

- Resolve an issue where CustomHullPlates and CustomPosters packs would not be installed in rare cases ([`44e1499`](https://github.com/toebeann/subnautica-support/commit/44e1499))

## [3.2.6] - 2023-02-10

### Fixed

- Resolve an issue where CustomPosters and CustomHullPlates packs were not being installed correctly ([`fc32500`](https://github.com/toebeann/subnautica-support/commit/fc32500))

## [3.2.5] - 2023-02-10

### Fixed

- Fix `Illegal invocation` error when changing Vortex gamemode from Subnautica ([`5c1dab2`](https://github.com/toebeann/subnautica-support/commit/5c1dab2))

## [3.2.4] - 2023-02-09

### Fixed

- Fix Vortex flagging the extension as incompatible

## [3.2.3] - 2023-01-29

### Fixed

- Allow QModManager to install BepInEx core files `0Harmony109.dll` and `0Harmony12.dll` ([`e37ee7c`](https://github.com/toebeann/subnautica-support/commit/e37ee7c))

## [3.2.2] - 2023-01-28

### Fixed

- Assume user is on the stable branch if the Steam app manifest cannot be read for any reason ([`d818c75`](https://github.com/toebeann/subnautica-support/commit/d818c75))

## [3.2.1] - 2023-01-28

### Fixed

- Fix `Cannot read properties of undefined (reading 'BetaKey')` error when reading Steam app manifest ([`a2900bb`](https://github.com/toebeann/subnautica-support/commit/a2900bb))

## [3.2.0] - 2023-01-26

### Added

- Support mods which can be installed as either BepInEx plugins or QMods based on user's branch ([`d068e93`](https://github.com/toebeann/subnautica-support/commit/d068e93))

### Removed

- Drop support for Vortex versions older than 1.7.0

## [3.1.0] - 2023-01-17

### Changed

- Treat QModManager as a BepInEx plugin/patcher when installing, excluding BepInEx core files ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))
- Require users to install BepInEx when installing QModManager ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))
- Improve dialog and notification wording ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))
- Replace dialog warning about QModManager being installed on wrong branch with a notification for user comfort ([`8958a35`](https://github.com/toebeann/subnautica-support/commit/8958a35))

### Added

- Rename `BepInEx.cfg` to `BepInEx.stable.cfg` and `BepInEx.cfg` to `BepInEx.legacy.cfg` automatically when installing the BepInEx pack on legacy ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))
- Notify user to reinstall BepInEx when changing to/from the legacy branch to ensure the correct `BepInEx.cfg` is used ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))
- Notify the user that they need to install BepInEx if it is not already installed ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))
- Notify user to reinstall QModManager if it was installed by an earlier version of the extension to address file conflicts with the BepInEx pack

### Removed

- Remove the dialog prompting the user to uninstall BepInEx on the legacy branch ([`e1057a4`](https://github.com/toebeann/subnautica-support/commit/e1057a4))

## [3.0.0] - 2023-01-12

_This release comprises a complete rewrite of the extension from scratch by the new lead maintainer, [toebeann]._

### Changed

- Improve the game version detection so that the actual game version is reported rather than the version of the Unity engine used to compile it ([`1f5ed9d`](https://github.com/toebeann/subnautica-support/commit/1f5ed9d))

### Added

- Support installing the BepInEx Pack for Subnautica ([`bfd80d5`](https://github.com/toebeann/subnautica-support/commit/bfd80d5))
- Support installing BepInEx plugins and patchers ([`bfd80d5`](https://github.com/toebeann/subnautica-support/commit/bfd80d5))
- Prompt the user to uninstall BepInEx when they are on the legacy branch ([`d268915`](https://github.com/toebeann/subnautica-support/commit/d268915))
- Prompt the user to uninstall QModManager when they are not on the legacy branch ([`d268915`](https://github.com/toebeann/subnautica-support/commit/d268915))
- Display a dialog informing the user about the changes to Subnautica since the Living Large update and how this affects modding ([`d268915`](https://github.com/toebeann/subnautica-support/commit/d268915))

## 2.2.2 - 2022-12-20

_This release is a recall of previously released versions 2.2.0 and 2.2.1, and is exactly the same as version 2.1.4._

### Added

- Support Vortex ~1.4.0

### Removed

- Drop BepInEx support

## 2.2.1 - 2022-12-15

### Changed

- Improve BepInEx support

## 2.2.0 - 2022-12-15

### Added

- Support BepInEx

### Removed

- Drop support for Vortex versions older than 1.6.0

## 2.1.4 - 2022-06-30

### Added

- Support the Xbox and Microsoft Store apps

## 2.1.3 - 2021-07-14

_Changelogs for this release were not recorded by the prior maintainers._

## 2.1.2 - 2021-04-25

### Changed

- Prevent installing multiple QMods from a single archive

## 2.1.1 - 2021-02-15

### Added

- Support installing QModManager

## 2.1.0 - 2021-02-05

_Changelogs for this release were not recorded by the prior maintainers._

[3.3.0]: https://github.com/toebeann/subnautica-support/releases/tag/v3.3.0
[3.2.8]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.8
[3.2.7]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.7
[3.2.6]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.6
[3.2.5]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.5
[3.2.4]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.4
[3.2.3]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.3
[3.2.2]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.2
[3.2.1]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.1
[3.2.0]: https://github.com/toebeann/subnautica-support/releases/tag/v3.2.0
[3.1.0]: https://github.com/toebeann/subnautica-support/releases/tag/v3.1.0
[3.0.0]: https://github.com/toebeann/subnautica-support/releases/tag/v3.0.0
[toebeann]: https://github.com/toebeann
