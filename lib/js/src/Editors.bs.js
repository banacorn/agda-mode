// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Belt_Option = require("bs-platform/lib/js/belt_Option.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");

function make(editor) {
  return {
          focused: /* Source */0,
          source: editor,
          query: undefined
        };
}

function getID(self) {
  return String(self.source.id);
}

function get(editors) {
  var match = editors.focused;
  if (match) {
    var match$1 = editors.query;
    if (match$1 !== undefined) {
      return Caml_option.valFromOption(match$1);
    } else {
      return editors.source;
    }
  } else {
    return editors.source;
  }
}

function on(sort, editors) {
  if (sort) {
    Belt_Option.forEach(Belt_Option.map(editors.query, (function (prim) {
                return atom.views.getView(prim);
              })), (function (prim) {
            prim.focus();
            return /* () */0;
          }));
    editors.focused = /* Query */1;
    return /* () */0;
  } else {
    atom.views.getView(editors.source).focus();
    editors.focused = /* Source */0;
    return /* () */0;
  }
}

var Focus = {
  get: get,
  on: on
};

function getSymbol(editors) {
  var arg = get(editors).getSelectedText();
  return (function (param) {
                return (function (param$1) {
                    return arg.substr(param, param$1);
                  });
              })(0)(1);
}

function getTextNode(editors) {
  var getLargerSyntaxNode = function (param) {
    get(editors).selectLargerSyntaxNode();
    return get(editors).getSelectedText();
  };
  var getPointedWord = function (param) {
    get(editors).selectWordsContainingCursors();
    return get(editors).getSelectedText();
  };
  var selectedText = get(editors).getSelectedText();
  if (selectedText === "") {
    var largerNode = getLargerSyntaxNode(/* () */0);
    if (largerNode === "") {
      return getPointedWord(/* () */0);
    } else {
      var pointedText = getPointedWord(/* () */0);
      if (pointedText === "_") {
        return getLargerSyntaxNode(/* () */0);
      } else {
        return pointedText;
      }
    }
  } else {
    return selectedText;
  }
}

var $$Selection = {
  getSymbol: getSymbol,
  getTextNode: getTextNode
};

exports.make = make;
exports.getID = getID;
exports.Focus = Focus;
exports.$$Selection = $$Selection;
/* No side effect */
