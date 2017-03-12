## 0.6.12
* Fix #38

## 0.6.11
* Renew the unicode symbols input keymap

## 0.6.10
* Fix #39 and #41 (thanks to @jonaprieto and @ruhatch)

## 0.6.9
* Fix unable to input certain symbols before agda-mode:load

## 0.6.8
* Fix hole index parsing and display
* Fix agda-mode:solve-constraints unable to fill out solutions

## 0.6.7
* Fix memory leak of event handlers on package deactivation

## 0.6.6
* Allow clicking through those annoying invisible goal index overlays
* Restore indirect highlighting information passing

## 0.6.5
* Fix judgement parsing (#23)
* Fix "Not In Scope" error parsing

## 0.6.4
* Fix judgement parsing (#23)
* Fix plain text message won't display

## 0.6.3
* Fix judgement parsing (#23)
* Introduce dev-mode-only monitor (for debugging)

## 0.6.2
* Fix mini editor won't go away
* Fix S-expression parsing

## 0.6.1
* Merge pull request #35, which fixed file path handling on Windows (by @NightRa)
* Merge pull request #36, which drastically sped up S-expression parsing 👍 (by @NightRa)
* Brings undo/redo back
* Fix problems of clicking on locations

## 0.6.0
* Rewrite the whole view with React/Redux, say goodbye to Vue.js
* Allow the panel to be docked at other panes
* Allow the panel docked at bottom to be resizable
* Fix #34

## 0.5.4
* Handle some more cases of error
* Text in the mini text editor is now selected by default

## 0.5.3
* Rewrite everything with TypeScript
* Fix tons of shit with the aid of types
* Fix #32
* Fix #31
* Fix #23 ?
* Upgrade dependencies


## 0.5.1
* Fix the problem when a hole spans multiple lines (which arose from fixing #29)
* Upgrade lodash to v4.12

## 0.5.0
* Fix #29
* Fix hole parsing. Bangs '!' and curly brackets '}' are allowed inside a hole now
* Default to trim spaces of an expression in a hole when giving (This is not the case in Agda 2.5.1)

## 0.4.11
* Better undo/redo
* Add a tiny spinner for time-consuming commands

## 0.4.10
* Case splitting in lambda expressions!
* Handles Emacs command 'agda2-maybe-goto'

## 0.4.9
* Fix library loading for the new library management system after Agda 2.5.0
* Fix goal components (boundary/content/index) positioning
* Make the maximum number of rows displayed in the panel adjustable

## 0.4.8
* Add a new command "agda-mode:solve-constraints"

## 0.4.7
* Add a new command "agda-mode:info"

## 0.4.6
* Fix #27

## 0.4.5
* Search for Agda executable automatically, no need to fill this manually
* Allow users to specify Agda program name
* Allow users to specify Agda program arguments
* Allow users to specify compile backend

## 0.4.4
* Fix #12 and #24

## 0.4.3
* Fix #14
* Fix view: hide panel header when not in use

## 0.4.2
* Fix #12
* Update dependencies

## 0.4.1
* Fix EOF error when refining a empty goal
* Fix message location parsing error

## 0.4.0
* Fix file path related problems on Windows

## 0.3.13
* Fix message parsing
* Fix message location jumps

## 0.3.12
* Better error message
* Message locations are now clickable

## 0.3.11
* Make Input Method optional, enable or disable it in the settings
* Fix #22

## 0.3.9
* Input method:
    * Candidate symbols
    * Deactivate and left the text-buffer as-is when a user types `return` ('enter')
* Fix #21

## 0.3.8
* Better type info presentation
* Fix #20

## 0.3.7
* Now we can invoke input method and type unicode symbols in the input box

## 0.3.6
* Fix goal parsing

## 0.3.5
* Fix when `ctrl-c ctrl-w` failed to query current goal
* Jump to a goal by clicking on it's index
* Postpone package activation until `agda-mode:load` for better editor startup time

## 0.3.4
* View System rewritten with `Vue`, to prevent memory leaks in `v0.3.3`

## 0.3.3
* Input method: key suggestions now are clickable buttons.

## 0.3.2
* Supports command `Ctrl-c Ctrl-w` *why in scope*.
* Fix when sometimes input box won't show.
* Now we can select and copy texts in the panel.
* Better input method suggestion looking.

## 0.3.1

* Supports 3 different levels of normalization (simple, none, full). (#17)

## 0.3.0

* Nothing big really, just a new number.
* Enable unsolvedmeta and terminationproblem highlight. (#7)
* Use colours given by user installed syntax.
* Fixed #18
