# HACKING

This plugin is written in [Reason](https://reasonml.github.io/) (basically OCaml)
, which compiles to JS via [BuckleScript](https://bucklescript.github.io/en/).

The user interface is built using [React](https://reactjs.org/), with
[ReasonReact](https://reasonml.github.io/reason-react/en/) as the binding.

## Environment setup

1. clone the repo and load it as a development package
2. open the repo in the development mode
3. install dependencies
4. checkout to the `dev` branch. The `master` branch is for stable releases.

```
apm develop agda-mode
atom -d ~/github/agda-mode
cd ~/github/agda-mode
npm install
git checkout dev
```

You would also need to have Reason and BuckleScript installed:

* [Installation](https://reasonml.github.io/docs/en/installation)
* [Editor Plugins](https://reasonml.github.io/docs/en/editor-plugins)

## `dev` and `master` branch

The only difference between `dev` and `master` is the entry point of the package, specified in `./package.json`.
* `master`: `./lib/js/bundled.js`.
* `dev`: `./lib/js/src/AgdaMode.bs`.

## Handy commands

To have the BuckleScript transpiler running while developing:

```
npm run start
```

If the built artefacts are stale, to rebuild them, simple run `start` again:

```
npm run start
```

To re-build the keymaps from Agda's Emacs mode, run:

```
npm run keymap-gen
```

This runs [`./keymap.el`](./keymap.el), which can also be run manually and pointed to a custom Agda path.

To print the keymap list, run:

```
npm run keymap-print
```

To build and bundle `./lib/js/bundled.js` (the entry file):

```
npm run build
```
