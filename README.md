# Subnautica Support for [Vortex]

## Description

This extension adds support for Subnautica to [Vortex Mod Manager], enabling you to easily automate installation of mods for Subnautica without having to worry about where the files are supposed to go, etc.

At this time, the following mod types are supported:

- BepInEx Pack for Subnautica
- BepInEx plugins
- BepInEx patchers
- QModManager
- QMods
- CustomCraft2 plugin packs
- CustomHullPlates addon packs
- CustomPosters addon packs

If you are developing a different kind of mod and would like it to be supported by this extension, please [raise an issue or pull request on the GitHub repository](https://github.com/toebeann/subnautica-support/issues) with a link to your mod page so that I can take a look at how you are packaging it. Please make sure to include instructions for how you would expect it to be installed, so that I can have Vortex automate the process. PRs welcome!

## How to install

This extension requires [Vortex] ^1.8.0. To install, click the Vortex button at the top of [the Nexus Mods page](https://www.nexusmods.com/site/mods/202) to open this extension within Vortex, and then click `Install`. Alternatively, within Vortex, go to the `Extensions` tab, click "`Find More`" at the bottom of the tab, search for "Subnautica Support" and then click `Install`.

You can also manually install it by downloading the main file and dragging it into the "drop zone" labelled "`Drop File(s)`" in the `Extensions` tab at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Subnautica mods with Vortex.

***

**<center><big>The rest of this page is intended for mod authors only.<br/>Users can simply follow the instructions above to install, and you're done!</big></center>**

<center><a href="https://ko-fi.com/toebean_" target="_blank"><img src="https://uploads-ssl.webflow.com/5c14e387dab576fe667689cf/61e11d503cc13747866d338b_Button-2-p-800.png" alt="Support toebeann on Ko-fi"/></a></center>

***

## How to make my mod compatible with this extension?

Assuming your mod is of a supported type, simply follow the packaging examples for that mod type below.

Don't forget to set your latest main file as your main Vortex file, and make sure that the "`Remove the 'Download with Manager' button`" option is unticked!

If your mod is not of a supported type, you will need to [raise an issue or pull request on the GitHub repository](https://github.com/toebeann/subnautica-support/issues) with a link to your mod page so that I can take a look at how you are packaging it. Please make sure to include instructions for how you would expect it to be installed.

### Packaging examples

#### BepInEx plugins

Any of the following structures are valid:

```
- MyBepInExPlugin.dll
```

```
- My BepInEx Plugin
  - MyBepInExPlugin.dll
```

```
- plugins
  - MyBepInExPlugin.dll
```

```
- plugins
  - My BepInEx Plugin
    - MyBepInExPlugin.dll
```

```
- BepInEx
  - plugins
      - MyBepInExPlugin.dll
```

```
- BepInEx
  - plugins
    - My BepInEx Plugin
      - MyBepInExPlugin.dll
```

#### BepInEx patchers

Any of the following structures are valid:

```
- patchers
  - MyBepInExPatcher.dll
```

```
- patchers
  - My BepInEx Patcher
    - MyBepInExPlugin.dll
```

```
- BepInEx
  - patchers
      - MyBepInExPatcher.dll
```

```
- BepInEx
  - patchers
    - My BepInEx Patcher
      - MyBepInExPatcher.dll
```

#### BepInEx plugin/patcher combos

Any of the following structures are valid:

```
- patchers
  - MyBepInExPatcher.dll
- plugins
  - MyBepInExPlugin.dll
```

```
- patchers
  - My Mod Name
    - MyBepInExPatcher.dll
- plugins
  - My Mod Name
    - MyBepInExPlugin.dll
```

```
- BepInEx
  - patchers
    - MyBepInExPatcher.dll
  - plugins
    - MyBepInExPlugin.dll
```

```
- BepInEx
  - patchers
    - My Mod Name
      - MyBepInExPatcher.dll
  - plugins
    - My Mod Name
      - MyBepInExPlugin.dll
```

#### QMods

Any of the following structures are valid:

```
- My QMod
  - mod.json
  - MyQMod.dll
```

```
- QMods
  - My QMod
    - mod.json
    - MyQMod.dll
```

```
- mod.json
- MyQMod.dll
```

#### Mods which can be installed as either a QMod or a BepInEx plugin

Mods which meet all of the following criteria are eligible to be installed as either a QMod or a BepInEx plugin:

- has a `mod.json` manifest for QModManager
- has an assembly containing a `BaseUnityPlugin` class with a `BepInPlugin` attribute applied to it
- has the following structure:
  ```
  - My Mod
    - mod.json
    - MyMod.dll
  ```

When a user installs an eligible mod, if the user is on the legacy branch, it will be installed as a QMod. Otherwise, it will be installed as a BepInEx plugin.

### CustomCraft2 plugin packs

Any of the following structures are valid. Note that although these examples only include a single asset and/or working file each, the extension will happily install packs containing multiple of each.

```
- CustomCraft2SML
  - Assets
    - MyCC2Asset.png
  - WorkingFiles
    - MyCC2Mod.txt
```

```
- CustomCraft2SML
  - WorkingFiles
    - MyCC2Mod.txt
```

#### CustomHullPlates addon packs

Any of the following structures are valid. Note that although these examples only include a single hull plate, the extension will happily install packs containing multiple hull plates.

```
- CustomHullPlates
  - HullPlates
    - MyHullPlate
      - icon.png
      - info.json
      - texture.png
```

```
- HullPlates
  - MyHullPlate
    - icon.png
    - info.json
    - texture.png
```

```
- MyHullPlate
  - icon.png
  - info.json
  - texture.png
```

#### CustomPosters addon packs

Any of the following structures are valid. Note that although these examples only include a single poster, the extension will happily install packs containing multiple posters.

```
- CustomPosters
  - Posters
    - MyPoster
      - icon.png
      - info.json
      - texture.png
```

```
- Posters
  - MyPoster
    - icon.png
    - info.json
    - texture.png
```

```
- MyPoster
  - icon.png
  - info.json
  - texture.png
```

### Mixed CustomHullPlates/CustomPosters addon packs

Any of the following structures are valid. Note that although these examples only include a single hull plate and poster each, the extension will happily install packs containing multiple of each.

```
- CustomHullPlates
  - HullPlates
    - MyHullPlate
      - icon.png
      - info.json
      - texture.png
- CustomPosters
  - Posters
    - MyPoster
      - icon.png
      - info.json
      - texture.png
```

```
- HullPlates
  - MyHullPlate
    - icon.png
    - info.json
    - texture.png
- Posters
  - MyPoster
    - icon.png
    - info.json
    - texture.png
```

```
- MyHullPlate
  - icon.png
  - info.json
  - texture.png
- MyPoster
  - icon.png
  - info.json
  - texture.png
```

#### My mod is being installed strangely!

If you have followed the packaging examples above and your mod is still being incorrectly installed by this extension, please [raise an issue on the GitHub repository](https://github.com/toebeann/subnautica-support/issues) with a link to your mod page or with a sample archive attached so that I can get it fixed.

## Copyright notice

Subnautica Support - Vortex support for Subnautica
Copyright (C) 2023 Tobey Blaber

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program; if not, see <https://www.gnu.org/licenses>.

[Vortex]: https://www.nexusmods.com/about/vortex/
[Vortex Mod Manager]: https://www.nexusmods.com/about/vortex/
