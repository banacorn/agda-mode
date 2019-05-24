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

To have the BuckleScript transpiler running while developing:

```
npm run start
```

To build and bundle everything into one JS file:

```
npm run build
```

To clean the built artefacts:

```
npm run clean
```
