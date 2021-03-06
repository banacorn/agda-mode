let sort = Array.sort;
open Rebase;
open Util.React;

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

  let _oldBuffer = editor |> TextEditor.getTextInBufferRange(rangeOld);
  let newBuffer = editor |> TextEditor.getTextInBufferRange(rangeNew);
  // if (_oldBuffer != newBuffer) {
  //   Js.log(
  //     "[ IM ][ monitor ] \""
  //     ++ _oldBuffer
  //     ++ "\" "
  //     ++ string_of_int(Point.column(Range.end_(rangeOld)))
  //     ++ " => \""
  //     ++ newBuffer
  //     ++ "\" "
  //     ++ string_of_int(Point.column(Range.end_(rangeNew))),
  //   );
  // };
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
  | Stuck
  | Abort;

// for determining whether the previous changes to the system should be regarded as one atomic operation or not
let hasChanged = (state, changeLog) => {
  // // there was a Rewrite + Deactivate combo
  // let rewriteDeactivateCombo = !state.activated && changeLog == Complete;

  // there was a Deactivate + Activate combo
  // also happens when agda-mode was activated by triggering the input-method
  let deactivateActivateCombo = !state.activated && changeLog == Noop;

  // when the user hit "ESC"
  let aborted = changeLog == Abort;

  // !rewriteDeactivateCombo && !deactivateActivateCombo || aborted;
  !deactivateActivateCombo || aborted;
};

[@react.component]
let make =
    (
      ~editors: Editors.t,
      // this event is triggered whenever the user did something
      ~onChange: Event.t(state),
      ~panelActivated: bool,
    ) => {
  let editor = Editors.Focus.get(editors);
  // display markers
  let (markers, setMarkers) = Hook.useState([||]);
  // state
  let (state, send) = React.useReducer(reducer, initialState);
  let stateRef = React.useRef(state);
  // keep record of previous changes
  let (changeLog, setChangeLog) = Hook.useState(Noop);

  // update with the latest state
  React.Ref.setCurrent(stateRef, state);

  let channels = React.useContext(Channels.context);

  // input: listens to `activateInputMethod`
  Hook.useChannel(
    shouldActivate => {
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
        setChangeLog(Abort);
        send(Deactivate);
      };
      Promise.resolved();
    },
    channels.activateInputMethod,
  );

  // input: programmatically inserting some keys
  Hook.useChannel(
    char => {
      insertTextBuffer(editor, char);
      Promise.resolved();
    },
    channels.interceptAndInsertKey,
  );

  // do something when the "reality" changed
  // let (reality, setReality) = Hook.useState("");
  let setReality = s => send(UpdateReality(s));
  React.useEffect1(
    () => {
      switch (Buffer.next(state.buffer, state.reality)) {
      | Noop =>
        // Js.log("[ IM ][ reality ][ Noop ] ");
        setChangeLog(Noop)
      | Insert(buffer) =>
        // Js.log("[ IM ][ reality ][ Insert ] " ++ Buffer.toString(buffer));
        setChangeLog(Noop);
        send(UpdateBuffer(buffer));
      | Backspace(buffer) =>
        // Js.log("[ IM ][ reality ][ Backspace ] " ++ Buffer.toString(buffer));
        setChangeLog(Noop);
        send(UpdateBuffer(buffer));
      | Rewrite(buffer) =>
        // Js.log("[ IM ][ reality ][ Rewrite ] " ++ Buffer.toString(buffer));
        setChangeLog(Rewrite);
        send(UpdateBuffer(buffer));
        let surface = Buffer.toSurface(buffer);
        rewriteTextBuffer(editor, markers, surface);
      | Complete =>
        // Js.log("[ IM ][ reality ][ Complete ]");
        setChangeLog(Complete);
        send(Deactivate);
      | Stuck(_n) =>
        // Js.log2("[ IM ][ reality ][ Stuck ]", _n);
        setChangeLog(Stuck);
        send(Deactivate);
      };
      None;
    },
    [|state.reality|],
  );

  // for debugging and tests
  let debugDispatch = React.useContext(Type.View.Debug.debugDispatch);
  React.useEffect2(
    () => {
      if (hasChanged(state, changeLog)) {
        // Js.log("[ IM ][ change ]");
        onChange.emit(state);
      };

      // Js.log3(state.activated, Buffer.toString(state.buffer), state.reality);

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

  // listens to certain events only when the IM is activated
  Hook.useListenWhen(
    () => monitor(editor, setMarkers, setReality, send),
    state.activated,
  );

  let translation = Translator.translate(Buffer.toSequence(state.buffer));
  // the view

  <section className={"input-method" ++ showWhen(state.activated)}>
    <div className="keyboard">
      <div
        className={
          "inline-block buffer" ++ showWhen(!Buffer.isEmpty(state.buffer))
        }>
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
      activated={panelActivated && state.activated}
      updateTranslation={replace =>
        switch (replace) {
        | Some(symbol) =>
          onChange.emit(state);
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