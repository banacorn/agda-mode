let sort = Array.sort;
open ReactUpdate;
open Rebase;

/********************************************************************************************/

type state = {
  activated: bool,
  buffer: Buffer.t, // what we have in mind
  reality: string // the result as seen on the editor
};

let initialState = {activated: false, buffer: Buffer.initial, reality: ""};

type action =
  | Activate
  | Deactivate
  | UpdateBuffer(Buffer.t)
  | UpdateReality(string);

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

let markerOnDidChange = (editor, setReality, event) => {
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
  let _oldBuffer =
    editor |> TextEditor.getBuffer |> TextBuffer.getTextInRange(rangeOld);
  let newBuffer =
    editor |> TextEditor.getBuffer |> TextBuffer.getTextInRange(rangeNew);
  setReality(newBuffer);
};

/* monitor the text buffer to figures out what happend */
let monitor = (editor, setMarkers, setReality, send) => {
  open Atom;
  let disposables = CompositeDisposable.make();

  // add class name to the DOM to target certain event
  addClass(editor);

  // mark and store the markers
  let markers = clearAndMarkSelectedAreas(editor);
  setMarkers(markers);

  // monitors the first marker
  markers[0]
  |> Option.forEach(marker => {
       marker
       |> DisplayMarker.onDidChange(markerOnDidChange(editor, setReality))
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
              TextEditor.decorateMarkerOptions(
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
      setMarkers([||]);
    },
  );
};

let reducer = (state, action) => {
  switch (action) {
  | Activate =>
    state.activated
      ? {activated: false, buffer: Buffer.initial, reality: ""}
      : {...state, activated: true}
  | Deactivate =>
    state.activated
      ? {activated: false, buffer: Buffer.initial, reality: ""} : state
  | UpdateBuffer(buffer) =>
    // return the original state if nothing's changed
    if (buffer === state.buffer) {
      state;
    } else {
      {...state, buffer};
    }
  | UpdateReality(reality) => {...state, reality}
  };
};

type change =
  | Noop
  | Rewrite
  | Complete
  | Stuck;

let hasCombo = (state, changeLog) => {
  // there was a Rewrite + Deactivate combo
  let rewriteDeactivateCombo = !state.activated && changeLog == Complete;

  // there was a Deactivate + Activate combo
  // also happens when agda-mode was activated by triggering the input-method
  let deactivateActivateCombo = !state.activated && changeLog == Noop;

  // Js.log3(state.activated, Buffer.toSurface(state.buffer), changeLog);

  rewriteDeactivateCombo || deactivateActivateCombo;
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
      ~onActivationChange: Event.t(bool, unit),
      // this event is triggered whenever the user did something
      ~onChange: Event.t(unit, unit),
      ~isActive: bool,
    ) => {
  let editor = Editors.Focus.get(editors);
  // display markers
  let (markers, setMarkers) = Hook.useState([||]);

  let (state, send) = React.useReducer(reducer, initialState);
  let stateRef = React.useRef(state);
  // for
  let (changeLog, setChangeLog) = Hook.useState(Noop);
  let pushChange = action => {
    // let x = changeLog;
    setChangeLog(action);
  };

  // do something when the "reality" changed
  // let (reality, setReality) = Hook.useState("");
  let setReality = s => send(UpdateReality(s));
  React.useEffect1(
    () => {
      switch (Buffer.next(state.buffer, state.reality)) {
      | Noop(buffer) =>
        pushChange(Noop);
        send(UpdateBuffer(buffer));
      | Rewrite(buffer) =>
        pushChange(Rewrite);
        send(UpdateBuffer(buffer));
        let surface = Buffer.toSurface(buffer);
        rewriteTextBuffer(editor, markers, surface);
      | Complete =>
        pushChange(Complete);
        send(Deactivate);
      | Stuck =>
        pushChange(Stuck);
        send(Deactivate);
      };
      None;
    },
    [|state.reality|],
  );

  // dev mode debug
  let debugDispatch = React.useContext(Type.View.Debug.debugDispatch);
  React.useEffect2(
    () => {
      if (!hasCombo(state, changeLog)) {
        onChange |> Event.emitOk();
      };

      // log when the state changes
      if (Atom.inDevMode()) {
        debugDispatch(
          UpdateInputMethod({
            activated: state.activated,
            markers,
            buffer: state.buffer,
          }),
        );
      };
      None;
    },
    (state.activated, state.buffer),
  );

  // update with the latest state
  React.Ref.setCurrent(stateRef, state);
  // listens to `activateInputMethod`
  React.useEffect1(
    () =>
      activateInputMethod
      |> Event.onOk(shouldActivate => {
           let state = React.Ref.current(stateRef);
           if (shouldActivate) {
             if (state.activated) {
               if (Buffer.isEmpty(state.buffer)) {
                 // already activated, this happens when the 2nd backslash '\' kicks in
                 // the user probably just want to type '\', so we leave it as is
                 insertTextBuffer(editor, "\\");
                 send(Deactivate);
               } else {
                 // Deactivate and then Activate, see #102: https://github.com/banacorn/agda-mode/issues/102
                 // allow users to type combos like ≡⟨⟩ with `\==\<\>`
                 send(Deactivate);
                 send(Activate);
               };
             } else {
               send(Activate);
             };
           } else {
             send(Deactivate);
           };
         })
      |> Option.some,
    [||],
  );

  // triggers events on change
  Hook.useDidUpdateEffect(
    () => {
      onActivationChange |> Event.emitOk(state.activated);
      None;
    },
    [|state.activated|],
  );

  React.useEffect1(
    () =>
      interceptAndInsertKey
      |> Event.onOk(char => insertTextBuffer(editor, char))
      |> Option.some,
    [||],
  );

  // listens to certain events only when the IM is activated
  Hook.useListenWhen(
    () => monitor(editor, setMarkers, setReality, send),
    state.activated,
  );

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
            <button
              className="btn"
              onClick={_ => insertTextBuffer(editor, key)}
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
      isActive={isActive && state.activated}
      updateTranslation={replace =>
        switch (replace) {
        | Some(symbol) =>
          onChange |> Event.emitOk();
          rewriteTextBuffer(editor, markers, symbol);
        | None => ()
        }
      }
      chooseSymbol={symbol => {
        rewriteTextBuffer(editor, markers, symbol);
        send(Deactivate);
      }}
      candidateSymbols={translation.candidateSymbols}
    />
  </section>;
};
