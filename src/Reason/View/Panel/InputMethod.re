open ReasonReact;

let sort = Array.sort;

open Rebase;

open Webapi.Dom;

[@bs.module "./../../../asset/keymap"]
external rawKeymap : Js.t({.}) = "default";

type trie = {
  symbol: array(string),
  subTrie: Js.Dict.t(trie),
};

let rec toTrie = (obj: Js.t({.})) : trie => {
  let symbol = [%raw {|
  obj[">>"] || ""
|}];
  let subTrie =
    obj
    |> Js.Obj.keys
    |> Array.filter(key => key != ">>")
    |> Array.map(key => (key, toTrie([%raw {|
    obj[key]
  |}])))
    |> Js.Dict.fromArray;
  {symbol, subTrie};
};

let keymap = toTrie(rawKeymap);

let toKeySuggestions = (trie: trie) : array(string) =>
  Js.Dict.keys(trie.subTrie);

let toCandidateSymbols = (trie: trie) : array(string) => trie.symbol;

/* see if the underlying is in the keymap */
let isInKeymap = (input: string) : option(trie) => {
  let rec helper = (input: string, trie: trie) : option(trie) =>
    switch (String.length(input)) {
    | 0 => Some(trie)
    | n =>
      let key = String.sub(~from=0, ~length=1, input);
      let rest = String.sub(~from=1, ~length=n - 1, input);
      switch (Js.Dict.get(trie.subTrie, key)) {
      | Some(trie') => helper(rest, trie')
      | None => None
      };
    };
  helper(input, keymap);
};

type translation = {
  symbol: option(string),
  further: bool,
  keySuggestions: array(string),
  candidateSymbols: array(string),
};

/* converts characters to symbol, and tells if there's any further possible combinations */
let translate = (input: string) : translation =>
  switch (isInKeymap(input)) {
  | Some(trie) =>
    let keySuggestions = toKeySuggestions(trie);
    let candidateSymbols = toCandidateSymbols(trie);
    {
      symbol: candidateSymbols[0],
      further: Array.length(keySuggestions) != 0,
      keySuggestions,
      candidateSymbols,
    };
  | None =>
    /* key combination out of keymap
       replace with closest the symbol possible */
    {
      symbol: None,
      further: false,
      keySuggestions: [||],
      candidateSymbols: [||],
    }
  };


/********************************************************************************************/
module Garbages = Atom.CompositeDisposable;

open Atom.Environment;

type buffer = {
  surface: string, /* what people see */
  underlying: string /* what people typed */
};

type state = {
  editors: Editors.t,
  activated: bool,
  /* view related */
  decorations: array(Atom.Decoration.t),
  markers: array(Atom.DisplayMarker.t),
  markersDisposable: option(Atom.Disposable.t),
  /* translation */
  buffer,
  translation,
};

let initialBuffer = {surface: "", underlying: ""};

let initialTranslation = translate("");

let initialState = (editors, _) => {
  editors,
  activated: false,
  /* view related */
  decorations: [||],
  markers: [||],
  markersDisposable: None,
  /* translation */
  buffer: initialBuffer,
  translation: initialTranslation,
};

type action =
  | Activate
  | Deactivate
  /* user actions */
  | Insert(string)
  | Backspace
  /* resource bookkeeping */
  | UpdateMarkers(
      array(Atom.DisplayMarker.t),
      array(Atom.Decoration.t),
      option(Atom.Disposable.t),
    )
  /* manual actions */
  | InsertSurfaceBuffer(string)
  | RewriteSurfaceBuffer(string);

let markerOnDidChange = (event, self) => {
  open Atom;
  let rangeOld =
    Atom.Range.make(
      event##oldTailBufferPosition,
      event##oldHeadBufferPosition,
    );
  let rangeNew =
    Atom.Range.make(
      event##newTailBufferPosition,
      event##newHeadBufferPosition,
    );
  let comparison = Atom.Range.compare(rangeOld, rangeNew);
  let textBuffer =
    Editors.getFocusedEditor(self.state.editors) |> TextEditor.getBuffer;
  if (Atom.Range.isEmpty(rangeNew)) {
    self.send(Deactivate);
  } else {
    let surfaceBuffer = textBuffer |> TextBuffer.getTextInRange(rangeNew);
    if (surfaceBuffer != self.state.buffer.surface) {
      /* Insert */
      if (comparison == (-1)) {
        let char =
          Js.String.substr(
            ~from=-1,
            textBuffer |> TextBuffer.getTextInRange(rangeNew),
          );
        self.send(Insert(char));
      };
      /* Backspace */
      if (comparison == 1) {
        self.send(Backspace);
      };
    };
  };
};

let insertActualBuffer = (char, self) => {
  open Atom;
  let editor = Editors.getFocusedEditor(self.state.editors);
  let textBuffer = editor |> TextEditor.getBuffer;
  /* get all selections and sort them */
  let getCharIndex = selection => {
    let start = Atom.Selection.getBufferRange(selection) |> Atom.Range.start;
    textBuffer |> TextBuffer.characterIndexForPosition(start);
  };
  let compareSelection = (a: Atom.Selection.t, b: Atom.Selection.t) => {
    let indexA = getCharIndex(a);
    let indexB = getCharIndex(b);
    compare(indexA, indexB);
  };
  let selections = TextEditor.getSelections(editor);
  sort(compareSelection, selections);
  selections
  |> Array.forEach(selection => {
       let range = Atom.Selection.getBufferRange(selection);
       /* replace the selected text with the inserted string */
       textBuffer |> TextBuffer.setTextInRange(range, char) |> ignore;
     });
};

let reducer = (onActivationChange, action, state) =>
  switch (action) {
  | Activate =>
    onActivationChange(true);
    state.activated ?
      SideEffects(
        (
          self =>
            /* already activated, it happens when we get the 2nd */
            /* backslash '\' comes in */
            if (state.buffer.underlying |> String.isEmpty) {
              /* the user probably just want to type '\', we shall leave it as is */
              self.send(
                Deactivate,
              );
            } else {
              /* keep going, see issue #34: https://github.com/banacorn/agda-mode/issues/34 */
              self.send(
                InsertSurfaceBuffer("\\"),
              );
            }
        ),
      ) :
      UpdateWithSideEffects(
        {...state, activated: true},
        (
          self => {
            open Atom;
            let editor = Editors.getFocusedEditor(state.editors);
            /* add class 'agda-mode-input-method-activated' */
            Views.getView(editor)
            |> HtmlElement.classList
            |> DomTokenListRe.add("agda-mode-input-method-activated");
            /* monitors raw text buffer and figures out what happend */
            let markers =
              editor
              |> TextEditor.getSelectedBufferRanges
              |> Array.map(range =>
                   editor
                   |> TextEditor.markBufferRange(Atom.Range.copy(range))
                 );
            /* monitors only the first marker */
            let markersDisposable =
              markers[0]
              |> Option.map(marker =>
                   marker
                   |> DisplayMarker.onDidChange(
                        self.handle(markerOnDidChange),
                      )
                 );
            /* decorate the editor with these markers */
            let decorations =
              markers
              |> Array.map(marker =>
                   editor
                   |> TextEditor.decorateMarker(
                        marker,
                        {
                          "type": "highlight",
                          "class": "input-method-decoration",
                        },
                      )
                 );
            /* store these markers and stuff */
            self.send(
              UpdateMarkers(markers, decorations, markersDisposable),
            );
            /* insert '\' at the cursor to indicate the activation */
            self.send(InsertSurfaceBuffer("\\"));
          }
        ),
      );
  | Deactivate =>
    onActivationChange(false);
    state.activated ?
      UpdateWithSideEffects(
        {
          ...state,
          activated: false,
          buffer: initialBuffer,
          translation: initialTranslation,
        },
        (
          _self => {
            open Atom;
            /* remove class 'agda-mode-input-method-activated' */
            Editors.getFocusedEditor(state.editors)
            |> Views.getView
            |> HtmlElement.classList
            |> DomTokenListRe.remove("agda-mode-input-method-activated");
            /* destroy all markers and stuff */
            state.markers |> Array.forEach(DisplayMarker.destroy);
            state.decorations |> Array.forEach(Decoration.destroy);
            state.markersDisposable
            |> Option.map(Disposable.dispose)
            |> ignore;
          }
        ),
      ) :
      NoUpdate;
  | Insert(char) =>
    let input = state.buffer.underlying ++ char;
    let translation = translate(input);
    switch (translation.symbol) {
    | Some(symbol) =>
      UpdateWithSideEffects(
        {
          ...state,
          buffer: {
            surface: symbol,
            underlying: input,
          },
          translation,
        },
        (
          self => {
            /* reflects current translation to the text buffer */
            self.send(RewriteSurfaceBuffer(symbol));
            /* deactivate if we can't go further */
            if (! translation.further) {
              self.send(Deactivate);
            };
          }
        ),
      )
    | None =>
      UpdateWithSideEffects(
        {
          ...state,
          buffer: {
            surface: state.buffer.surface ++ char,
            underlying: input,
          },
          translation,
        },
        (
          self =>
            /* deactivate if we can't go further */
            if (! translation.further) {
              self.send(Deactivate);
            }
        ),
      )
    };
  | Backspace =>
    let init = s =>
      Js.String.substring(~from=0, ~to_=String.length(s) - 1, s);
    let surface = init(state.buffer.surface);
    let input = init(state.buffer.underlying);
    let translation = translate(input);
    Update({
      ...state,
      buffer: {
        surface,
        underlying: input,
      },
      translation,
    });
  | UpdateMarkers(markers, decorations, markersDisposable) =>
    Update({...state, markers, decorations, markersDisposable})
  | InsertSurfaceBuffer(char) =>
    UpdateWithSideEffects(
      {
        ...state,
        buffer: {
          ...state.buffer,
          surface: state.buffer.surface ++ char,
        },
      },
      insertActualBuffer(char),
    )
  | RewriteSurfaceBuffer(string) =>
    UpdateWithSideEffects(
      {
        ...state,
        buffer: {
          ...state.buffer,
          surface: string,
        },
      },
      (
        _self =>
          state.markers
          |> Array.forEach(marker =>
               Atom.(
                 Editors.getFocusedEditor(state.editors)
                 |> TextEditor.getBuffer
                 |> TextBuffer.setTextInRange(
                      DisplayMarker.getBufferRange(marker),
                      string,
                    )
               )
               |> ignore
             )
      ),
    )
  };

let component = reducerComponent("InputMethod");

let make =
    (
      ~editors: Editors.t,
      ~interceptAndInsertKey: (string => unit) => unit,
      ~activate: (unit => unit) => unit,
      ~onActivationChange: bool => unit,
      _children,
    ) => {
  ...component,
  initialState: initialState(editors),
  reducer: reducer(onActivationChange),
  didMount: self => {
    /* binding for the JS */
    interceptAndInsertKey(char => {
      self.send(InsertSurfaceBuffer(char));
      self.send(Insert(char));
    });
    activate(() => self.send(Activate));
    /* listening some events */
    let garbages = Garbages.make();
    /* intercept newline `\n` as confirm */
    Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "editor:newline",
      event =>
      if (self.state.activated) {
        self.send(Deactivate);
        event |> Event.stopImmediatePropagation;
      }
    )
    |> Garbages.add(garbages);
    self.onUnmount(() => garbages |> Garbages.dispose);
  },
  render: self => {
    let {activated, buffer, translation} = self.state;
    let className =
      ["input-method"]
      |> Util.React.addClass("hidden", ! activated)
      |> Util.React.toClassName;
    let bufferClassName =
      ["inline-block", "buffer"]
      |> Util.React.addClass("hidden", String.isEmpty(buffer.surface))
      |> Util.React.toClassName;
    <section className>
      <div className="keyboard">
        <div className=bufferClassName> (string(buffer.underlying)) </div>
        <div className="keys btn-group btn-group-sm">
          ...(
               translation.keySuggestions
               |> Array.map(key =>
                    <button
                      className="btn"
                      onClick=(
                        (_) => {
                          self.send(Insert(key));
                          self.send(InsertSurfaceBuffer(key));
                        }
                      )
                      key>
                      (string(key))
                    </button>
                  )
             )
        </div>
      </div>
      <CandidateSymbols
        updateTranslation=(
          replace =>
            switch (replace) {
            | Some(symbol) => self.send(InsertSurfaceBuffer(symbol))
            | None => ()
            }
        )
        chooseSymbol=(
          symbol => {
            self.send(InsertSurfaceBuffer(symbol));
            self.send(Deactivate);
          }
        )
        candidateSymbols=translation.candidateSymbols
      />
    </section>;
  },
};
