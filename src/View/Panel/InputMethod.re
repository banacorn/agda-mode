[@bs.config {jsx: 3}];

// open ReasonReact;
open ReactUpdate;

let sort = Array.sort;

open Rebase;

[@bs.module "./../../../../../asset/keymap.js"]
external rawKeymap: Js.t({.}) = "default";

type trie = {
  symbol: array(string),
  subTrie: Js.Dict.t(trie),
};

let rec toTrie = (obj: Js.t({.})): trie => {
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

let toKeySuggestions = (trie: trie): array(string) =>
  Js.Dict.keys(trie.subTrie);

let toCandidateSymbols = (trie: trie): array(string) => trie.symbol;

/* see if the underlying is in the keymap */
let isInKeymap = (input: string): option(trie) => {
  let rec helper = (input: string, trie: trie): option(trie) =>
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
let translate = (input: string): translation => {
  switch (isInKeymap(Js.String.substr(~from=1, input))) {
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
};

/********************************************************************************************/
module Garbages = Atom.CompositeDisposable;

open Atom.Environment;

type buffer = {
  surface: string, /* what people see */
  underlying: string /* what people typed */
};

type state = {
  activated: bool,
  /* view related */
  decorations: array(Atom.Decoration.t),
  markers: array(Atom.DisplayMarker.t),
  markersDisposables: option(Garbages.t),
  /* translation */
  buffer,
  translation,
};

let initialBuffer = {surface: "", underlying: ""};

let initialTranslation = translate("");

let initialState = {
  activated: false,
  /* view related */
  decorations: [||],
  markers: [||],
  markersDisposables: None,
  /* translation */
  buffer: initialBuffer,
  translation: initialTranslation,
};

type action =
  | Activate
  | Deactivate
  /* user actions */
  | InsertUnderlying(string)
  | Backspace
  /* resource bookkeeping */
  | UpdateMarkers(
      array(Atom.DisplayMarker.t),
      array(Atom.Decoration.t),
      option(Garbages.t),
    )
  /* manual actions */
  | InsertSurface(string)
  | InsertSurfaceAndUnderlying(string)
  | RewriteSurface(string);

let markerOnDidChange = (editors, state, send, event) => {
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
  let textBuffer = Editors.Focus.get(editors) |> TextEditor.getBuffer;
  if (Atom.Range.isEmpty(rangeNew)) {
    send(Deactivate);
  } else {
    let surfaceBuffer = textBuffer |> TextBuffer.getTextInRange(rangeNew);
    if (surfaceBuffer != state.buffer.surface) {
      /* Insert */
      if (comparison == (-1)) {
        let insertedChar =
          Js.String.substr(
            ~from=-1,
            textBuffer |> TextBuffer.getTextInRange(rangeNew),
          );
        send(InsertUnderlying(insertedChar));
      };
      /* Backspace */
      if (comparison == 1) {
        send(Backspace);
      };
    };
  };
};

let insertActualBuffer = (editors, char) => {
  open Atom;
  let editor = Editors.Focus.get(editors);
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

let reducer = (editors, action, state) =>
  switch (action) {
  | Activate =>
    state.activated
      ? SideEffects(
          ({send}) =>
            /* already activated, it happens when we get the 2nd */
            /* backslash '\' comes in */
            if (state.buffer.underlying |> String.isEmpty) {
              /* the user probably just want to type '\', we shall leave it as is */
              send(Deactivate);
              None;
            } else {
              /* keep going, see issue #34: https://github.com/banacorn/agda-mode/issues/34 */
              send(InsertSurface("\\"));
              None;
            },
        )
      : UpdateWithSideEffects(
          {...state, activated: true},
          ({send}) => {
            open Webapi.Dom;
            open Atom;
            let focusedEditor = Editors.Focus.get(editors);
            /* add class 'agda-mode-input-method-activated' */
            Views.getView(focusedEditor)
            |> HtmlElement.classList
            |> DomTokenListRe.add("agda-mode-input-method-activated");
            /* monitors raw text buffer and figures out what happend */
            let markers =
              focusedEditor
              |> TextEditor.getSelectedBufferRanges
              |> Array.map(range =>
                   focusedEditor
                   |> TextEditor.markBufferRange(Atom.Range.copy(range))
                 );
            /* monitors only the first marker */
            let markersDisposables =
              markers[0]
              |> Option.map(marker => {
                   let garbages = Garbages.make();
                   // monitors the marker's change
                   marker
                   |> DisplayMarker.onDidChange(
                        markerOnDidChange(editors, state, send),
                      )
                   |> Garbages.add(garbages);
                   /* monitors the cursor, deactivate if it was moved out of the marker #94 */
                   Editors.Focus.get(editors)
                   |> TextEditor.onDidChangeCursorPosition(event => {
                        let point = event##newBufferPosition;
                        let ranges =
                          markers |> Array.map(DisplayMarker.getBufferRange);
                        let inRange =
                          ranges
                          |> Array.exists(Atom.Range.containsPoint(point));
                        if (!inRange) {
                          send(Deactivate);
                        };
                      })
                   |> Garbages.add(garbages);
                   garbages;
                 });
            /* decorate the editor with these markers */
            let decorations =
              markers
              |> Array.map(marker =>
                   focusedEditor
                   |> TextEditor.decorateMarker(
                        marker,
                        TextEditor.decorationParams(
                          ~type_="highlight",
                          ~class_="input-method-decoration",
                          (),
                        ),
                      )
                 );
            /* store these markers and stuff */
            send(UpdateMarkers(markers, decorations, markersDisposables));
            /* insert '\' at the cursor to indicate the activation */
            send(InsertSurface("\\"));

            None;
          },
        )
  | Deactivate =>
    state.activated
      ? UpdateWithSideEffects(
          {
            ...state,
            activated: false,
            buffer: initialBuffer,
            translation: initialTranslation,
          },
          _ => {
            open Webapi.Dom;
            open Atom;
            /* remove class 'agda-mode-input-method-activated' */
            editors
            |> Editors.Focus.get
            |> Views.getView
            |> HtmlElement.classList
            |> DomTokenListRe.remove("agda-mode-input-method-activated");
            /* destroy all markers and stuff */
            state.markers |> Array.forEach(DisplayMarker.destroy);
            state.decorations |> Array.forEach(Decoration.destroy);
            state.markersDisposables |> Option.map(Garbages.dispose) |> ignore;

            None;
          },
        )
      : NoUpdate
  | InsertUnderlying(char) =>
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
        ({send}) => {
          /* reflects current translation to the text buffer */
          send(RewriteSurface(symbol));
          /* deactivate if we can't go further */
          if (!translation.further) {
            send(Deactivate);
          };
          None;
        },
      )
    | None =>
      UpdateWithSideEffects(
        {
          ...state,
          buffer: {
            surface: state.buffer.surface,
            /* surface: state.buffer.surface ++ char, */
            underlying: input,
          },
          translation,
        },
        ({send}) => {
          /* deactivate if we can't go further */
          if (!translation.further) {
            send(Deactivate);
          };
          None;
        },
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
  | UpdateMarkers(markers, decorations, markersDisposables) =>
    Update({...state, markers, decorations, markersDisposables})
  | InsertSurface(char) =>
    UpdateWithSideEffects(
      {
        ...state,
        buffer: {
          ...state.buffer,
          surface: state.buffer.surface ++ char,
        },
      },
      _ => {
        insertActualBuffer(editors, char);
        None;
      },
    )
  | InsertSurfaceAndUnderlying(char) =>
    UpdateWithSideEffects(
      {
        ...state,
        buffer: {
          ...state.buffer,
          surface: state.buffer.surface ++ char,
        },
      },
      ({send}) => {
        insertActualBuffer(editors, char);
        send(InsertUnderlying(char));
        None;
      },
    )
  | RewriteSurface(string) =>
    ReactUpdate.UpdateWithSideEffects(
      {
        ...state,
        buffer: {
          ...state.buffer,
          surface: string,
        },
      },
      _ => {
        state.markers
        |> Array.forEach(marker =>
             Atom.(
               editors
               |> Editors.Focus.get
               |> TextEditor.getBuffer
               |> TextBuffer.setTextInRange(
                    DisplayMarker.getBufferRange(marker),
                    string,
                  )
             )
             |> ignore
           );
        None;
      },
    )
  };

[@react.component]
let make =
    (
      ~editors: Editors.t,
      /*
       Issue #34: https://github.com/banacorn/agda-mode/issues/34
       Intercept some keys that Bracket Matcher autocompletes
        to name them all: "{", "[", "{", "\"", "'", and `
       Because the Bracket Matcher package is too lacking, it does not responds
        to the disabling of the package itself, making it impossible to disable
        the package during the process of input.
       On the other hand, the Atom's CommandRegistry API is also inadequate,
        we cannot simply detect which key was pressed, so we can only hardwire
        the keys we wanna intercept from the Keymaps
         */
      ~interceptAndInsertKey: Event.t(string, unit),
      ~activateInputMethod: Event.t(bool, unit),
      ~onActivationChange: bool => unit,
      ~isActive: bool,
    ) => {
  // let (activated, setActivated) = React.useState(_ => false);

  let (state, send) =
    ReactUpdate.useReducer(initialState, reducer(editors));
  let {activated, buffer, translation} = state;

  React.useEffect1(
    () => {
      onActivationChange(activated);
      None;
    },
    [|activated|],
  );
  React.useEffect(() =>
    activateInputMethod
    |> Event.onOk(activate => send(activate ? Activate : Deactivate))
    |> Option.some
  );

  React.useEffect(() =>
    interceptAndInsertKey
    |> Event.onOk(char => send(InsertSurfaceAndUnderlying(char)))
    |> Option.some
  );

  Hook.useAtomListener(() =>
    Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "editor:newline",
      event =>
      if (state.activated) {
        send(Deactivate);
        event |> Webapi.Dom.Event.stopImmediatePropagation;
      }
    )
  );
  open Util.ClassName;
  let className =
    ["input-method"] |> addWhen("hidden", !activated) |> serialize;
  let bufferClassName =
    ["inline-block", "buffer"]
    |> addWhen("hidden", String.isEmpty(buffer.underlying))
    |> serialize;
  <section className>
    <div className="keyboard">
      <div className=bufferClassName> {React.string(buffer.underlying)} </div>
      {translation.keySuggestions
       |> Array.map(key =>
            <button
              className="btn"
              onClick={_ => send(InsertSurfaceAndUnderlying(key))}
              key>
              {React.string(key)}
            </button>
          )
       |> ReactDOMRe.createDOMElementVariadic(
            "div",
            ~props=
              ReactDOMRe.domProps(
                ~className="keys btn-group btn-group-sm",
                (),
              ),
          )}
    </div>
    <CandidateSymbols
      isActive
      updateTranslation={replace =>
        switch (replace) {
        | Some(symbol) => send(RewriteSurface(symbol))
        | None => ()
        }
      }
      chooseSymbol={symbol => {
        send(InsertSurfaceAndUnderlying(symbol));
        send(Deactivate);
      }}
      candidateSymbols={translation.candidateSymbols}
    />
  </section>;
};

module Jsx2 = {
  let component = ReasonReact.statelessComponent("InputMethod");
  let make =
      (
        ~editors: Editors.t,
        ~interceptAndInsertKey: Event.t(string, unit),
        ~activateInputMethod: Event.t(bool, unit),
        ~onActivationChange: bool => unit,
        ~isActive: bool,
        children,
      ) =>
    ReasonReactCompat.wrapReactForReasonReact(
      make,
      makeProps(
        ~editors,
        ~interceptAndInsertKey,
        ~activateInputMethod,
        ~onActivationChange,
        ~isActive,
        (),
      ),
      children,
    );
};
