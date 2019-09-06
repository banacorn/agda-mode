let sort = Array.sort;
open ReactUpdate;
open Rebase;

/********************************************************************************************/

type state = {
  activated: bool,
  markers: array(Atom.DisplayMarker.t),
  buffer: Buffer.t,
};

let initialState = {activated: false, markers: [||], buffer: Buffer.initial};

type action =
  | Activate
  | Deactivate
  | Reactivate // Deactivate and then Activate
  | UpdateMarker(array(Atom.DisplayMarker.t))
  | MarkerEvent(string, string)
  | Insert(string)
  | Rewrite(string);

/* add class 'agda-mode-input-method-activated' */
let addClass = editor => {
  Webapi.Dom.(
    editor
    |> Atom.Views.getView
    |> HtmlElement.classList
    |> DomTokenList.add("agda-mode-input-method-activated")
  );
};
/* remove class 'agda-mode-input-method-activated' */
let removeClass = editor => {
  Webapi.Dom.(
    editor
    |> Atom.Views.getView
    |> HtmlElement.classList
    |> DomTokenList.remove("agda-mode-input-method-activated")
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
              {
                "type": "highlight",
                "class": "input-method-decoration",
                "style": Js.Obj.empty(),
              },
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

let reducer = (editor, action, state) => {
  switch (action) {
  | Activate =>
    state.activated
      ? SideEffects(
          ({send}) => {
            // already activated, this happens when the 2nd backslash '\' kicks in
            if (Buffer.isEmpty(state.buffer)) {
              // the user probably just want to type '\', so we leave it as is
              send(Insert("\\"));
              send(Deactivate);
            } else {
              // Deactivate and then Activate, see #102: https://github.com/banacorn/agda-mode/issues/102
              // allow users to type combos like ≡⟨⟩ with `\==\<\>`
              send(
                Reactivate,
              );
            };
            None;
          },
        )
      : Update({...state, activated: true})
  | Deactivate =>
    state.activated
      ? Update({...state, activated: false, buffer: Buffer.initial})
      : NoUpdate
  | Reactivate =>
    state.activated
      ? UpdateWithSideEffects(
          {...state, activated: false, buffer: Buffer.initial},
          ({send}) => {
            send(Activate);
            None;
          },
        )
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
      ~onInputMethodActivationChange: Event.t(bool, unit),
      ~isActive: bool,
    ) => {
  let editor = Editors.Focus.get(editors);

  let (state, send) = ReactUpdate.useReducer(initialState, reducer(editor));

  // dev mode debug
  let debugDispatch = React.useContext(Type.View.Debug.debugDispatch);
  React.useEffect1(
    () => {
      if (Atom.inDevMode()) {
        debugDispatch(
          UpdateInputMethod({
            activated: state.activated,
            markers: state.markers,
            buffer: state.buffer,
          }),
        );
      };
      None;
    },
    [|state|],
  );

  React.useEffect1(
    () =>
      activateInputMethod
      |> Event.onOk(shouldActivate =>
           send(shouldActivate ? Activate : Deactivate)
         )
      |> Option.some,
    [||],
  );

  // triggers events on change
  Hook.useDidUpdateEffect(
    () => {
      onActivationChange(state.activated);
      onInputMethodActivationChange |> Event.emitOk(state.activated);
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
