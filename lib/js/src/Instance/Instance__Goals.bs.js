// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Atom = require("atom");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Goal$AgdaMode = require("../Goal.bs.js");
var Parser$AgdaMode = require("../Parser.bs.js");
var SourceFile$AgdaMode = require("../SourceFile.bs.js");

function destroyAll(instance) {
  Rebase.$$Array.forEach(Goal$AgdaMode.destroy, instance.goals);
  instance.goals = [];
  return /* () */0;
}

function find(index, instance) {
  var found = Rebase.$$Array.filter((function (goal) {
          return goal.index === index;
        }), instance.goals);
  return Rebase.$$Array.get(found, 0);
}

function setCursor(goal, instance) {
  var position = goal.range.start.translate(new Atom.Point(0, 3));
  instance.editors.source.setCursorBufferPosition(position);
  return /* () */0;
}

function getPositions(instance) {
  return Rebase.$$Array.map((function (range) {
                return range.start.translate(new Atom.Point(0, 3));
              }), Rebase.$$Array.map((function (goal) {
                    return goal.range;
                  }), instance.goals));
}

function getPreviousGoalPosition(instance) {
  var previousGoal = {
    contents: undefined
  };
  var cursor = instance.editors.source.getCursorBufferPosition();
  var positions = getPositions(instance);
  Rebase.$$Array.forEach((function (position) {
          if (position.isLessThan(cursor)) {
            previousGoal.contents = Caml_option.some(position);
            return /* () */0;
          } else {
            return 0;
          }
        }), positions);
  if (previousGoal.contents === undefined) {
    previousGoal.contents = Rebase.$$Array.get(positions, Rebase.$$Array.length(positions) - 1 | 0);
  }
  return previousGoal.contents;
}

function getNextGoalPosition(instance) {
  var nextGoal = {
    contents: undefined
  };
  var cursor = instance.editors.source.getCursorBufferPosition();
  var positions = getPositions(instance);
  Rebase.$$Array.forEach((function (position) {
          if (position.isGreaterThan(cursor) && nextGoal.contents === undefined) {
            nextGoal.contents = Caml_option.some(position);
            return /* () */0;
          } else {
            return 0;
          }
        }), positions);
  if (nextGoal.contents === undefined) {
    nextGoal.contents = Rebase.$$Array.get(positions, 0);
  }
  return nextGoal.contents;
}

function instantiateAll(indices, instance) {
  destroyAll(instance);
  var textEditor = instance.editors.source;
  var filePath = Parser$AgdaMode.filepath(Rebase.$$Option.getOr("untitled", textEditor.getPath()));
  var textBuffer = textEditor.getBuffer();
  var source = textEditor.getText();
  instance.goals = Rebase.$$Array.map((function (result) {
          var start = textBuffer.positionForCharacterIndex(result.originalRange[0]);
          var end_ = textBuffer.positionForCharacterIndex(result.originalRange[1]);
          var range = new Atom.Range(start, end_);
          textEditor.setTextInBufferRange(range, result.content);
          return Goal$AgdaMode.make(instance.editors.source, result.index, result.modifiedRange);
        }), SourceFile$AgdaMode.parse(indices, filePath, source));
  return /* () */0;
}

exports.destroyAll = destroyAll;
exports.find = find;
exports.setCursor = setCursor;
exports.getPositions = getPositions;
exports.getPreviousGoalPosition = getPreviousGoalPosition;
exports.getNextGoalPosition = getNextGoalPosition;
exports.instantiateAll = instantiateAll;
/* atom Not a pure module */