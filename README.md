# agda-mode on Atom

For people who don't wanna use Emacs for whatever reasons.

[![Join the chat at https://gitter.im/banacorn/agda-mode](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/banacorn/agda-mode?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Feel free to open issues!!!!**

## Requirements

* Atom Packages: [language-agda](https://atom.io/packages/language-agda)
* Binaries: [agda](http://wiki.portal.chalmers.se/agda/pmwiki.php?n=Main.Download)

## Installation

1. Ensure you have the Atom package [language-agda](https://atom.io/packages/language-agda) installed and enabled.
2. Ensure you have [agda](http://wiki.portal.chalmers.se/agda/pmwiki.php?n=Main.Download) properly installed. Try `agda` in your console.
3. Install the package:
  * from the editor: `Atom > Preferences... > Install`, search for `agda-mode` and install
  * or from a shell: `apm install agda-mode`
4. If you have Agda installed properly (i.e. `agda` is in the [PATH](https://en.wikipedia.org/wiki/PATH_(variable)), check it in your console), then it's good to go.

## Commands

This is an exhaustive list of available commands.

| Keymap            | Command                                 | Global | Goal-specific |
|------------------:|:----------------------------------------|:------:|:-------------:|
| `    C-c     C-l` | load a file                             |   ✓    |               |
| `    C-c C-x C-q` | quit                                    |   ✓    |               |
| `    C-c C-x C-r` | kill and restart Agda                   |   ✓    |               |
| `    C-c C-x C-c` | compile                                 |   ✓    |               |
| `    C-c C-x C-h` | toggle display of implicit arguments    |   ✓    |               |
| `    C-c     C-s` | solve constraints                       |   ✓    |               |
| `    C-c     C-=` | show constraints                        |   ✓    |               |
| `    C-c     C-?` | show goals                              |   ✓    |               |
| `    C-c     C-f` | next goal (forward)                     |   ✓    |               |
| `    C-c     C-b` | previous goal (back)                    |   ✓    |               |
| `    C-c C-x C-d` | toggle panel docking                    |   ✓    |               |
| `    C-c     C-n` | compute normal form                     |   ✓    |       ✓       |
| `C-u C-c     C-n` | compute normal form (ignoring abstract) |   ✓    |       ✓       |
| `    C-c     C-w` | why in scope                            |   ✓    |       ✓       |
| `    C-c     C-SPC` | give                                  |        |       ✓       |
| `    C-c     C-r` | refine                                  |        |       ✓       |
| `    C-c     C-a` | auto                                    |        |       ✓       |
| `    C-c     C-c` | case                                    |        |       ✓       |

Commands listed below support 3 different levels of normalization.

| Keymap            | Command                                 | Global | Goal-specific |
|------------------:|:----------------------------------------|:------:|:-------------:|
| `    C-c     C-d` | infer type                              |   ✓    |       ✓       |
| `    C-c     C-o` | module contents                         |   ✓    |       ✓       |
| `    C-c     C-t` | goal type                               |        |       ✓       |
| `    C-c     C-e` | context                                 |        |       ✓       |
| `    C-c     C-,` | goal type and context                   |        |       ✓       |
| `    C-c     C-.` | goal type and inferred type             |        |       ✓       |

Levels of normalization

| Prefix     | Normalization      |
|-----------:|:-------------------|
| `    `     | Simplified         |
| `C-u`      | No normalization   |
| `C-u C-u ` | Full normalization |

For example, `C-u C-c C-d` if you want to infer a type without normalizing it.
See [Agda:Issue 850](https://code.google.com/p/agda/issues/detail?id=850) for more discussion.

### Unicode Input method (only invokable under `.agda` or `.lagda`)

The key mapping of symbols are the same as in Emacs. For example: `\bn` for `ℕ`, `\all` for `∀`, `\r` or `\to` for `→`, etc.

| Keymap            | Command                     |
|------------------:|:----------------------------|
| `\\` or `alt-/`   | input symbol                |

### Commands not yet supported

| Keymap            | Command               | Reason               |
|------------------:|:----------------------|:---------------------|
| `    C-c C-x C-d` | remove goals and highlighting (deactivate) |
| `    C-c C-x M- ` | comment/uncomment the rest of the buffer | nope |



## How to contribute

### Environment Setup

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

The project is written in TypeScript so you would probably need these:
```
npm install -g typescript@2.2
apm install atom-typescript
```







![This gif looks cute so i'm keeping it](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)
