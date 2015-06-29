# agda-mode for Atom

[![Join the chat at https://gitter.im/banacorn/agda-mode](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/banacorn/agda-mode?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

For people who don't wanna use Emacs for whatever reasons.

Now available on [Atom](https://atom.io/packages/agda-mode)

PRs, issues and comments are all welcome.


## Commands

### Global commands

| Keymap            | Command               |
|------------------:|:----------------------|
| `    C-c     C-l` | load a file           |
| `    C-c C-x C-q` | quit                  |
| `    C-c C-x C-r` | kill and restart Agda |
| `    C-c C-x C-c` | compile               |
| `    C-c C-x C-h` | toggle display of implicit arguments |
| `    C-c     C-=` | show constraints      |
| `    C-c     C-?` | show goals            |
| `    C-c     C-f` | next goal (forward)   |
| `    C-c     C-b` | previous goal (back)  |
| `    C-c     C-d` | infer type            |
| `C-u C-c     C-d` | infer type (without normalizing) |
| `    C-c     C-o` | module contents       |
| `    C-c     C-n` | compute normal form   |
| `C-u C-c     C-n` | compute normal form (ignoring abstract) |

### Commands working in the context of a specific goal

| Keymap            | Command                     |
|------------------:|:----------------------------|
| `    C-c C-SPC`   | give                        |
| `    C-c C-r`     | refine                      |
| `    C-c C-a`     | auto                        |
| `    C-c C-c`     | case                        |
| `    C-c C-t`     | goal type                   |
| `C-u C-c C-t`     | goal type (without normalizing) |
| `    C-c C-e`     | context       |
| `C-u C-c C-e`     | context (without normalizing) |
| `    C-c C-d`     | infer type            |
| `C-u C-c C-d`     | infer type (without normalizing) |
| `    C-c C-,`     | goal type and context       |
| `C-u C-c C-,`     | goal type and context (without normalizing) |
| `    C-c C-.`     | goal type and inferred type |
| `C-u C-c C-.`     | goal type and inferred type (without normalizing) |
| `    C-c C-o`     | module contents       |
| `    C-c C-n`     | compute normal form   |
| `C-u C-c C-n`     | compute normal form (ignoring abstract) |

### Unicode Input method (only invokable under `.agda` or `.lagda`)

| Keymap            | Command                     |
|------------------:|:----------------------------|
| `\\` or `alt-/`   | input symbol                |

### Commands not yet supported

| Keymap            | Command               | Reason               |
|------------------:|:----------------------|:---------------------|
| `    C-c C-x C-d` | remove goals and highlighting (deactivate) |
| `    C-c     C-s` | solve constraints     | i have no idea what is this ◔_◔ |
| `    C-c C-x M- ` | comment/uncomment the rest of the buffer | nope |

![This gif looks cute so i'm keeping it](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)
