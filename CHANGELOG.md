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
