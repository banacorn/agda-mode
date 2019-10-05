# agda-mode on Atom

For people who don't wanna use Emacs for whatever reasons.

**Feel free to open issues!!!!**

## Requirements

* Binaries: [agda](https://agda.readthedocs.io/en/latest/getting-started/installation.html)

## Installation

1. Install this package:
  * from the editor: `Atom > Preferences... > Install`, search for `agda-mode` and install
  * or from a shell: `apm install agda-mode`
2. Ensure you have [agda](https://agda.readthedocs.io/en/latest/getting-started/installation.html) properly installed (check this in your console, type `agda` and see if it's in the [PATH](https://en.wikipedia.org/wiki/PATH_(variable))).

## Syntax Highlighting

Unlike on Emacs, **agda-mode on Atom doesn't come with syntax highlighting bundled**, nor does it highlight your code dynamically on load (yet).

To have your code highlighted:

1. Install **language-agda**:
  * from the editor: `Atom > Preferences... > Install`, search for `language-agda` and install
  * or from a shell: `apm install language-agda`

Extra perk: with *language-agda* installed, commands such as `input-symbol`, `go-to-definition` can be invoked without having to `load` first.

## Recommanded Settings

### Enable Scroll Past End

Go to `Settings > Editor > Scroll Past End` and enable it to allow the editor to
be scrolled past the end of the last line. The reason is that the height of the "panel" at the bottom is constantly changing, and it's pretty annoying to have
the editor jumping up and down with the panel.

## Commands

* <kbd>C-c</kbd> stands for "press <kbd>Ctrl</kbd> and <kbd>c</kbd> at the same time"
* When it comes to combos like <kbd>C-c</kbd> <kbd>C-l</kbd>, you can often slur
them into "hold <kbd>Ctrl</kbd> while pressing <kbd>c</kbd> and then <kbd>l</kbd>"

This is an (not so) exhaustive list of available commands:

| Keymap            | Command                                 | Global | Goal-specific |
|------------------:|:----------------------------------------|:------:|:-------------:|
| <kbd>C-c</kbd>                <kbd>C-l</kbd> | load a file                             |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-x</kbd> <kbd>C-q</kbd> | quit                                    |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-x</kbd> <kbd>C-r</kbd> | kill and restart Agda                   |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-x</kbd> <kbd>C-c</kbd> | compile                                 |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-x</kbd> <kbd>C-a</kbd> | abort                                   |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-x</kbd> <kbd>C-h</kbd> | toggle display of implicit arguments    |   ✓    |               |
| <kbd>C-c</kbd>                <kbd>C-=</kbd> | show constraints                        |   ✓    |               |
| <kbd>C-c</kbd>                <kbd>C-s</kbd> | solve constraints                       |   ✓    |               |
| <kbd>C-c</kbd>                <kbd>C-?</kbd> | show goals                              |   ✓    |               |
| <kbd>C-c</kbd>                <kbd>C-f</kbd> | next goal (forward)                     |   ✓    |               |
| <kbd>C-c</kbd>                <kbd>C-b</kbd> | previous goal (back)                    |   ✓    |               |
| <kbd>C-alt-\\</kbd> or <kbd>alt-cmd-\\</kbd> | go to definition                    |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-x</kbd> <kbd>C-d</kbd> | toggle panel docking                    |   ✓    |               |
|                               <kbd>C-c</kbd> <kbd>C-n</kbd>   | compute normal form                     |   ✓    |       ✓       |
|                <kbd>C-u</kbd> <kbd>C-c</kbd> <kbd>C-n</kbd>   | compute normal form (ignoring abstract) |   ✓    |       ✓       |
| <kbd>C-u</kbd> <kbd>C-u</kbd> <kbd>C-c</kbd> <kbd>C-n</kbd>   | compute normal form (use show instance) |   ✓    |       ✓       |
| <kbd>C-c</kbd>                <kbd>C-w</kbd> | why in scope                            |   ✓    |       ✓       |
| <kbd>C-c</kbd>                <kbd>C-SPC</kbd> | give                                  |        |       ✓       |
| <kbd>C-c</kbd>                <kbd>C-r</kbd> | refine                                  |        |       ✓       |
| <kbd>C-c</kbd>                <kbd>C-a</kbd> | auto                                    |        |       ✓       |
| <kbd>C-c</kbd>                <kbd>C-c</kbd> | case                                    |        |       ✓       |

Commands listed below support 3 different levels of normalization.

| Keymap                        | Command                                 | Global | Goal-specific |
|------------------------------:|:----------------------------------------|:------:|:-------------:|
| <kbd>C-c</kbd> <kbd>C-z</kbd> | search about                            |   ✓    |               |
| <kbd>C-c</kbd> <kbd>C-d</kbd> | infer type                              |   ✓    |       ✓       |
| <kbd>C-c</kbd> <kbd>C-o</kbd> | module contents                         |   ✓    |       ✓       |
| <kbd>C-c</kbd> <kbd>C-t</kbd> | goal type                               |        |       ✓       |
| <kbd>C-c</kbd> <kbd>C-e</kbd> | context                                 |        |       ✓       |
| <kbd>C-c</kbd> <kbd>C-,</kbd> | goal type and context                   |        |       ✓       |
| <kbd>C-c</kbd> <kbd>C-.</kbd> | goal type and inferred type             |        |       ✓       |

Levels of normalization

| Prefix                        | Normalization      |
|------------------------------:|:-------------------|
|                               | Simplified         |
| <kbd>C-u</kbd>                | No normalization   |
| <kbd>C-u</kbd> <kbd>C-u</kbd> | Full normalization |

For example, `C-u C-c C-d` if you want to infer a type without normalizing it.
See [Agda:Issue 850](https://code.google.com/p/agda/issues/detail?id=850) for more discussion.

### Unicode input method

To invoke the input method, press <kbd>\\</kbd> or <kbd>alt-/</kbd> in `.agda` or `.lagda` files.
The key mapping of symbols are the same as in Emacs. For example: `\bN` for `ℕ`, `\all` for `∀`, `\r` or `\to` for `→`, etc.

| Keymap                                     | Command                            |
|-------------------------------------------:|:-----------------------------------|
| <kbd>\\</kbd> or <kbd>alt-/</kbd>          | input symbol                       |
| <kbd>C-u</kbd> <kbd>C-x</kbd> <kbd>C-=</kbd> | lookup the key mapping of a symbol |

To customize the keymap, open the settings tab (at the bottom right) and go to `Input Method > Keymap extensions`

## How specify options to Agda

Go to `Settings > Packages > agda-mode`, put the options after the path of Agda in the `Settings` (exactly like what you would do in CLI). For example:

![image](https://i.imgur.com/SwKSWXZ.png)

## Trouble shooting

### Windows 10

If you are having trouble using agda-mode on Windows 10 (symptoms: #97, #98, #110)
Please consider follow [these instructions](https://github.com/banacorn/agda-mode/issues/97#issuecomment-491516453) and see if it works:
 
1. Go to the system's `Language settings`
2. Select `Administrative language settings`
3. Click `Change system locale...`
4. Check `Beta: Use Unicode UTF-8 for worldwide language support`

## Contribute

See [HACKING](HACKING.md)
