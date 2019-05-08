let sort = Array.sort;
open ReactUpdate;
open Rebase;
open Atom.Environment;

/********************************************************************************************/

module Buffer = {
  type t = {
    // the symbol at the front of the sequence along with the sequence it replaced
    symbol: option((string, string)),
    // the sequence following the symbol we see on the text editor
    tail: string,
  };

  let init = string =>
    Js.String.substring(~from=0, ~to_=String.length(string) - 1, string);

  let initial = {symbol: None, tail: ""};

  let isEmpty = self => {
    self.symbol == None && String.isEmpty(self.tail);
  };

  let toSequence = self =>
    switch (self.symbol) {
    | None => self.tail
    | Some((_, sequence)) => sequence ++ self.tail
    };

  let toSurface = self =>
    switch (self.symbol) {
    | None => self.tail
    | Some((symbol, _)) => symbol ++ self.tail
    };

  type action =
    | Noop(t) // should do nothing
    | Rewrite(t) // should rewrite the text buffer
    | Stuck; // should deactivate

  // devise the next state
  let next = (self, reality) => {
    let surface = toSurface(self);
    let sequence = toSequence(self);

    if (reality == surface) {
      if (Translator.translate(sequence).further && reality != "\\") {
        Noop(self);
      } else {
        Stuck;
      };
    } else if (init(reality) == surface) {
      // insertion
      let insertedChar = Js.String.substr(~from=-1, reality);
      let sequence' = sequence ++ insertedChar;
      let translation = Translator.translate(sequence');
      switch (translation.symbol) {
      | Some(symbol) =>
        if (insertedChar == symbol) {
          if (insertedChar == "\\") {
            Stuck;
          } else {
            Noop({symbol: Some((symbol, sequence')), tail: ""});
          };
        } else {
          Rewrite({symbol: Some((symbol, sequence')), tail: ""});
        }

      | None =>
        if (translation.further) {
          Noop({...self, tail: self.tail ++ insertedChar});
        } else {
          Stuck;
        }
      };
    } else if (reality == init(surface)) {
      // backspace deletion
      if (String.isEmpty(reality)) {
        if (Option.isSome(self.symbol)) {
          // A symbol has just been backspaced and gone
          Rewrite({
            symbol: None,
            tail: init(sequence),
          });
        } else {
          Stuck;
        };
      } else {
        // normal backspace
        Noop({...self, tail: init(self.tail)});
      };
    } else {
      Stuck;
    };
  };
};

type state = {
  activated: bool,
  markers: array(Atom.DisplayMarker.t),
  buffer: Buffer.t,
};

let initialState = {activated: false, markers: [||], buffer: Buffer.initial};

type action =
  | Activate
  | Deactivate
  | UpdateMarker(array(Atom.DisplayMarker.t))
  | MarkerEvent(string, string)
  | Insert(string)
  | Rewrite(string);

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

let getSelections = editor => {
  open Atom;
  /* get all selections and sort them */
  let getCharIndex = selection => {
    let start = Atom.Selection.getBufferRange(selection) |> Atom.Range.start;
    editor
    |> TextEditor.getBuffer
    |> TextBuffer.characterIndexForPosition(start);
  };
  let compareSelection = (a, b) =>
    compare(getCharIndex(a), getCharIndex(b));
  let selections = TextEditor.getSelections(editor);
  sort(compareSelection, selections);
  selections;
};

let insertTextBuffer = (editor, char) => {
  getSelections(editor)
  |> Array.forEach(selection => {
       let range = Atom.Selection.getBufferRange(selection);
       /* replace the selected text with the inserted string */
       editor |> Atom.TextEditor.setTextInBufferRange(range, char) |> ignore;
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

let clearAndMarkSelectedAreas = editor => {
  getSelections(editor)
  |> Array.map(selection => {
       let range = Atom.Selection.getBufferRange(selection);
       editor |> Atom.TextEditor.setTextInBufferRange(range, "") |> ignore;
       editor |> Atom.TextEditor.markBufferRange(Atom.Range.copy(range));
     });
};

let markerOnDidChange = (editor, send, event) => {
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
  let oldBuffer =
    editor |> TextEditor.getBuffer |> TextBuffer.getTextInRange(rangeOld);
  let newBuffer =
    editor |> TextEditor.getBuffer |> TextBuffer.getTextInRange(rangeNew);
  send(MarkerEvent(oldBuffer, newBuffer));
};

/* monitor the text buffer to figures out what happend */
let monitor = (editor, send) => {
  open Atom;
  let disposables = CompositeDisposable.make();

  // add class name to the DOM to target certain event
  addClass(editor);

  // mark and store the markers
  let markers = clearAndMarkSelectedAreas(editor);
  send(UpdateMarker(markers));

  // monitors the first marker
  markers[0]
  |> Option.forEach(marker => {
       marker
       |> DisplayMarker.onDidChange(markerOnDidChange(editor, send))
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
      removeClass(editor);
      decorations |> Array.forEach(Decoration.destroy);
      markers |> Array.forEach(DisplayMarker.destroy);
      disposables |> CompositeDisposable.dispose |> ignore;
      send(UpdateMarker([||]));
    },
  );
};

let reducer = (editor, action, state) =>
  switch (action) {
  | Activate =>
    state.activated
      ? SideEffects(
          ({send}) => {
            // already activated, this happens when the 2nd backslash '\' kicks in

            /* the user probably just want to type '\', so we leave it as is */
            send(Insert("\\"));

            /* deactivate or keep going, see issue #34: https://github.com/banacorn/agda-mode/issues/34 */
            if (Buffer.isEmpty(state.buffer)) {
              send(Deactivate);
            };
            None;
          },
        )
      : Update({...state, activated: true})
  | Deactivate =>
    state.activated
      ? Update({...state, activated: false, buffer: Buffer.initial})
      : NoUpdate
  | UpdateMarker(markers) => Update({...state, markers})
  | MarkerEvent(_oldBuffer, newBuffer) =>
    switch (Buffer.next(state.buffer, newBuffer)) {
    | Noop(buffer) => Update({...state, buffer})
    | Rewrite(buffer) =>
      UpdateWithSideEffects(
        {...state, buffer},
        ({send}) => {
          let surface = Buffer.toSurface(buffer);
          send(Rewrite(surface));
          None;
        },
      )
    | Stuck =>
      SideEffects(
        ({send}) => {
          send(Deactivate);
          None;
        },
      )
    }

  | Insert(char) =>
    SideEffects(
      _ => {
        insertTextBuffer(editor, char);
        None;
      },
    )
  | Rewrite(string) =>
    SideEffects(
      _ => {
        rewriteTextBuffer(editor, state.markers, string);
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
       Instead, we hardwire the keys we wanna intercept directly from the Keymaps.
         */
      ~interceptAndInsertKey: Event.t(string, unit),
      ~activateInputMethod: Event.t(bool, unit),
      ~onActivationChange: bool => unit,
      ~isActive: bool,
    ) => {
  let editor = Editors.Focus.get(editors);

  let (state, send) = ReactUpdate.useReducer(initialState, reducer(editor));

  // let toString = state => {
  //   Js.log(string_of_bool(state.activated));
  //   Js.log(Buffer.toSurface(state.buffer));
  //   Js.log(state.markers);
  // };
  //
  // React.useEffect1(
  //   () => {
  //     toString(state);
  //     None;
  //   },
  //   [|state|],
  // );

  React.useEffect1(
    () =>
      activateInputMethod
      |> Event.onOk(shouldActivate =>
           send(shouldActivate ? Activate : Deactivate)
         )
      |> Option.some,
    [||],
  );

  React.useEffect1(
    () => {
      onActivationChange(state.activated);
      None;
    },
    [|state.activated|],
  );

  React.useEffect1(
    () =>
      interceptAndInsertKey
      |> Event.onOk(char => send(Insert(char)))
      |> Option.some,
    [||],
  );

  // listens to certain events only when the IM is activated
  Hook.useListenWhen(() => monitor(editor, send), state.activated);

  let translation = Translator.translate(Buffer.toSequence(state.buffer));
  // the view
  open Util.ClassName;
  let className =
    ["input-method"] |> addWhen("hidden", !state.activated) |> serialize;
  let bufferClassName =
    ["inline-block", "buffer"]
    |> addWhen("hidden", Buffer.isEmpty(state.buffer))
    |> serialize;
  <section className>
    <div className="keyboard">
      <div className=bufferClassName>
        {React.string(Buffer.toSequence(state.buffer))}
      </div>
      {translation.keySuggestions
       |> Array.map(key =>
            <button className="btn" onClick={_ => send(Insert(key))} key>
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
      isActive={isActive && state.activated}
      updateTranslation={replace =>
        switch (replace) {
        | Some(symbol) => send(Rewrite(symbol))
        | None => ()
        }
      }
      chooseSymbol={symbol => {
        send(Insert(symbol));
        send(Deactivate);
      }}
      candidateSymbols={translation.candidateSymbols}
    />
  </section>;
};
