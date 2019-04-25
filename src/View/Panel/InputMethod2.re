[@bs.config {jsx: 3}];

// open ReasonReact;
open ReactUpdate;

let sort = Array.sort;

open Rebase;

module Keymap = {
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
  let initialTranslation = translate("");
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
  buffer,
  translation: Keymap.translation,
};
let initialState = {
  activated: false,
  buffer: {
    surface: "",
    underlying: "",
  },
  translation: Keymap.initialTranslation,
};

type action =
  | Activate
  | Deactivate
  | Clear
  /* user actions */
  | InsertUnderlying(string)
  | Backspace
  /* manual actions */
  | InsertSurface(string)
  | InsertSurfaceAndUnderlying(string)
  | RewriteSurface(string);

let insertTextBuffer = (editor, char) => {
  open Atom;
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

let rewriteTextBuffer = (editor, markers, string) => {
  markers
  |> Array.forEach(marker =>
       Atom.(
         editor
         |> TextEditor.getBuffer
         |> TextBuffer.setTextInRange(
              DisplayMarker.getBufferRange(marker),
              string,
            )
       )
       |> ignore
     );
};

let toString =
  fun
  | Activate => "Activate"
  | Deactivate => "Deactivate"
  | Clear => "Clear"
  /* user actions */
  | InsertUnderlying(string) => "InsertUnderlying " ++ string
  | Backspace => "Backspace"
  /* manual actions */
  | InsertSurface(string) => "InsertSurface " ++ string
  | InsertSurfaceAndUnderlying(string) =>
    "InsertSurfaceAndUnderlying " ++ string
  | RewriteSurface(string) => "RewriteSurface " ++ string;

let reducer = (editor, markers, setTranslation, action, state) => {
  Js.log(toString(action));
  Js.log("=-=-=-=-=-=");
  switch (action) {
  | Activate =>
    state.activated
      ? UpdateWithSideEffects(
          {...state, activated: false},
          ({send}) => {
            // already activated, this happens when the 2nd backslash '\' kicks in

            /* the user probably just want to type '\', so we leave it as is */
            if (state.buffer.underlying |> String.isEmpty) {
              send(Clear);
            } else {
              /* keep going, see issue #34: https://github.com/banacorn/agda-mode/issues/34 */
              send(
                InsertSurface("\\"),
              );
            };
            None;
          },
        )
      : UpdateWithSideEffects(
          {...state, activated: true},
          ({send}) => {
            send(InsertSurface("\\"));
            None;
          },
        )
  | Deactivate =>
    state.activated
      ? UpdateWithSideEffects(
          {...state, activated: false},
          ({send}) => {
            send(Clear);
            setTranslation(_ => Keymap.initialTranslation);
            None;
          },
        )
      : NoUpdate
  | Clear => Update({
               ...state,
               buffer: {
                 surface: "",
                 underlying: "",
               },
             })
  /* user actions */
  | InsertUnderlying(char) =>
    let input = state.buffer.underlying ++ char;
    let translation = Keymap.translate(input);
    Js.log(translation);
    setTranslation(_ => translation);
    switch (translation.symbol) {
    | Some(symbol) =>
      UpdateWithSideEffects(
        {
          ...state,
          buffer: {
            surface: symbol,
            underlying: input,
          },
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
            underlying: input,
          },
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
    let translation = Keymap.translate(input);
    Update({
      ...state,
      buffer: {
        surface,
        underlying: input,
      },
    });
  /* manual actions */
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
        insertTextBuffer(editor, char);
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
        insertTextBuffer(editor, char);
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
        rewriteTextBuffer(editor, markers, string);
        None;
      },
    )
  };
};

/* add class 'agda-mode-input-method-activated' */
let addClass = editor => {
  Webapi.Dom.(
    editor
    |> Views.getView
    |> HtmlElement.classList
    |> DomTokenListRe.add("agda-mode-input-method-activated")
  );
};
/* remove class 'agda-mode-input-method-activated' */
let removeClass = editor => {
  Webapi.Dom.(
    editor
    |> Views.getView
    |> HtmlElement.classList
    |> DomTokenListRe.remove("agda-mode-input-method-activated")
  );
};

let markSelectedAreas = editor => {
  editor
  |> Atom.TextEditor.getSelectedBufferRanges
  |> Array.map(range =>
       editor |> Atom.TextEditor.markBufferRange(Atom.Range.copy(range))
     );
};

let markerOnDidChange = (editor, buffer, send, event) => {
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
  let textBuffer = editor |> TextEditor.getBuffer;
  if (Atom.Range.isEmpty(rangeNew)) {
    send(Deactivate);
  } else {
    let surfaceBuffer = textBuffer |> TextBuffer.getTextInRange(rangeNew);
    if (surfaceBuffer != buffer.surface) {
      Js.log((surfaceBuffer, buffer.surface));
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

/* monitor the text buffer to figures out what happend */
let monitor = (editor, buffer, send, setMarkers) => {
  open Atom;
  let disposables = CompositeDisposable.make();

  addClass(editor);

  // store the markers
  let markers = markSelectedAreas(editor);
  setMarkers(_ => markers);
  // we only look at the first marker
  markers[0]
  |> Option.forEach(marker => {
       marker
       |> DisplayMarker.onDidChange(markerOnDidChange(editor, buffer, send))
       |> CompositeDisposable.add(disposables);
       // deactivate on newline
       Commands.add(
         `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
         "editor:newline",
         event => {
           send(Deactivate);
           event |> Webapi.Dom.Event.stopImmediatePropagation;
         },
       )
       |> CompositeDisposable.add(disposables);
     });

  /* monitors the cursor, deactivate if it was moved out of the marker #94 */
  editor
  |> TextEditor.onDidChangeCursorPosition(event => {
       let point = event##newBufferPosition;
       let ranges = markers |> Array.map(DisplayMarker.getBufferRange);
       let inRange = ranges |> Array.exists(Atom.Range.containsPoint(point));
       if (!inRange) {
         send(Deactivate);
       };
     })
  |> CompositeDisposable.add(disposables);

  /* decorate the editor with these markers */
  let decorations =
    markers
    |> Array.map(marker =>
         editor
         |> TextEditor.decorateMarker(
              marker,
              TextEditor.decorationParams(
                ~type_="highlight",
                ~class_="input-method-decoration",
                (),
              ),
            )
       );
  // destructor
  Some(
    () => {
      decorations |> Array.forEach(Decoration.destroy);
      markers |> Array.forEach(DisplayMarker.destroy);
      disposables |> CompositeDisposable.dispose |> ignore;
    },
  );
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
       Instead, we hardwire the keys we wanna intercept directly from the Keymaps.
         */
      ~interceptAndInsertKey: Event.t(string, unit),
      ~activateInputMethod: Event.t(bool, unit),
      ~onActivationChange: bool => unit,
      ~isActive: bool,
    ) => {
  let editor = Editors.Focus.get(editors);

  // Current translation
  let (translation, setTranslation) =
    React.useState(_ => Keymap.initialTranslation);

  let (markers, setMarkers) = React.useState(_ => [||]);

  // Buffer-related state
  let (state, send) =
    ReactUpdate.useReducer(
      initialState,
      reducer(editor, markers, setTranslation),
    );

  React.useEffect1(
    () => {
      Js.log(
        "buffer ["
        ++ state.buffer.surface
        ++ "] ["
        ++ state.buffer.underlying
        ++ "]",
      );
      None;
    },
    [|state.buffer|],
  );

  Hook.useListenWhen(
    () => monitor(editor, state.buffer, send, setMarkers),
    state.activated,
  );

  React.useEffect1(
    () => {
      Js.log("REG");
      activateInputMethod
      |> Event.onOk(shouldActivate => {
           Js.log("AC");
           send(shouldActivate ? Activate : Deactivate);
         })
      |> Option.some;
    },
    [||],
  );
  React.null;
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
