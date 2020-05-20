open ReasonReact;
open Rebase;
open Fn;
open Util.React;

module SymbolLookup = {
  [@react.component]
  let make = () => {
    let (input, setInput) = Hook.useState("");
    let translation = Translator.translate(input);

    let editorRef = React.useRef(None);

    let onChange = _ => {
      switch (editorRef.current) {
      | Some(editor) => setInput(Atom.TextEditor.getText(editor))
      | None => ()
      };
    };

    let candidateSymbols =
      translation.candidateSymbols
      |> Array.mapi((symbol, i) =>
           <kbd className="inline-block highlight" key={string_of_int(i)}>
             {string(symbol)}
           </kbd>
         )
      |> React.array;

    <section>
      <h2> {string("Symbol lookup")} </h2>
      <p> {string("Enter a key sequence and get corresponding symbols")} </p>
      <MiniEditor
        hidden=false
        value=""
        placeholder="enter some key sequence here, e.g 'lambda'"
        onEditorRef={ref => editorRef.current = Some(ref)}
        onChange
      />
      // adding className="native-key-bindings" tabIndex=(-1) for text copy
      <div
        id="candidate-symbols" className="native-key-bindings" tabIndex=(-1)>
        <div> candidateSymbols </div>
      </div>
    </section>;
  };
};

module KeySequenceLookup = {
  [@react.component]
  let make = () => {
    let (input, setInput) = Hook.useState([||]);
    let editorRef = React.useRef(None);

    let onChange = _ => {
      editorRef.current
      |> Option.map(Atom.TextEditor.getText)
      |> Option.flatMap(Translator.lookup)
      |> Option.forEach(setInput);
    };
    let results =
      input
      |> Array.mapi((sequence, i) =>
           <kbd className="inline-block highlight" key={string_of_int(i)}>
             {string(sequence)}
           </kbd>
         )
      |> React.array;

    <section>
      <h2> {string("Key sequences lookup")} </h2>
      <p> {string("Enter a symbol and get corresponding key sequences")} </p>
      <MiniEditor
        hidden=false
        value=""
        placeholder={j|enter some symbol here, e.g 'λ'|j}
        onEditorRef={ref => editorRef.current = Some(ref)}
        onChange
      />
      <p id="key-sequences" className="native-key-bindings" tabIndex=(-1)>
        <span> results </span>
      </p>
    </section>;
  };
};

module ExtendKeymap = {
  module AddEntry = {
    [@react.component]
    let make = (~onChange: unit => unit) => {
      let keyRef = React.useRef(None);
      let symbolsRef = React.useRef(None);
      let onClick = _ => {
        switch (keyRef.current, symbolsRef.current) {
        | (Some(keyEditor), Some(symbolsEditor)) =>
          let key = Atom.TextEditor.getText(keyEditor);
          let symbols =
            Atom.TextEditor.getText(symbolsEditor)
            |> Js.String.split("")
            |> Array.filter(String.isEmpty >> (!));
          Extension.add(key, symbols);
          Atom.TextEditor.setText("", keyEditor) |> ignore;
          Atom.TextEditor.setText("", symbolsEditor) |> ignore;
          onChange();
        | _ => ()
        };
      };

      <div id="add-entry">
        <div id="add-entry-key-sequence">
          <MiniEditor
            hidden=false
            value=""
            placeholder="key sequence"
            onEditorRef={ref => keyRef.current = Some(ref)}
          />
        </div>
        <div id="add-entry-symbols">
          <MiniEditor
            hidden=false
            value=""
            placeholder="corresponding symbols"
            onEditorRef={ref => symbolsRef.current = Some(ref)}
          />
        </div>
        <div id="add-entry-button">
          <button
            className="btn btn-primary icon icon-plus inline-block-tight"
            onClick>
            {string("add entry")}
          </button>
        </div>
      </div>;
    };
  };

  module ExtensionItem = {
    [@react.component]
    let make =
        (~sequence: string, ~symbols: array(string), ~onChange: unit => unit) => {
      let editorRef = React.useRef(None);

      // show the buttons when hovered
      let (hovered, setHovered) = Hook.useState(false);
      let onMouseOver = _ => setHovered(true);
      let onMouseLeave = _ => setHovered(false);

      //
      let (modifying, setModifying) = Hook.useState(false);
      let symbolsString = symbols |> List.fromArray |> String.joinWith(" ");

      // focus on the editor if it's being modified
      React.useEffect1(
        _ => {
          if (modifying) {
            switch (editorRef.current) {
            | Some(editor) =>
              Atom.Views.getView(editor) |> Webapi.Dom.HtmlElement.focus
            | None => ()
            };
          };
          None;
        },
        [|modifying|],
      );
      <li onMouseOver onMouseLeave>
        <div className="sequence"> {string(sequence)} </div>
        <div className="symbols">
          <div className={showWhen(!modifying)}>
            <>
              {symbols
               |> Array.mapi((symbol, i) =>
                    <kbd
                      className="inline-block highlight"
                      key={string_of_int(i)}>
                      {string(symbol)}
                    </kbd>
                  )
               |> React.array}
            </>
          </div>
          <MiniEditor
            hidden={!modifying}
            value=symbolsString
            placeholder={j|enter symbols here, the whole entry would be deleted if left empty|j}
            onCancel={_ => setModifying(false)}
            onConfirm={value => {
              let symbols =
                value
                |> Js.String.split("")
                |> Array.filter(String.isEmpty >> (!));
              if (Array.length(symbols) === 0) {
                Extension.delete(sequence);
              } else {
                Extension.modify(sequence, symbols);
              };
              setModifying(false);
              onChange();
            }}
            onEditorRef={ref => editorRef.current = Some(ref)}
          />
        </div>
        <div className={"buttons" ++ showWhen(hovered && !modifying)}>
          <button
            className="btn icon icon-pencil inline-block-tight"
            onClick={_ => setModifying(true)}>
            {string("modify")}
          </button>
          <button
            onClick={_ => {
              Extension.delete(sequence);
              onChange();
            }}
            className="btn btn-error icon icon-trashcan inline-block-tight">
            {string("delete")}
          </button>
        </div>
      </li>;
    };
  };

  [@react.component]
  let make = () => {
    // force re-render onChange
    let (keymap, setKeymap) = Hook.useState(Extension.readKeymap());
    let forceUpdate = () => setKeymap(Extension.readKeymap());
    let onChange = React.useCallback1(forceUpdate, [||]);

    /* placeholder */
    React.useEffect1(
      _ => {
        let destructor =
          Atom.Config.onDidChange("agda-mode.inputMethodExtension", _ =>
            forceUpdate()
          );
        Some(_ => Atom.Disposable.dispose(destructor));
      },
      [||],
    );

    let resetToDefault =
      React.useCallback1(
        _ => {
          Extension.resetToDefault();
          forceUpdate();
        },
        [||],
      );

    let items =
      <ul id="extensions">
        {keymap
         |> Js.Dict.entries
         |> Array.mapi(((sequence, symbols), i) =>
              <ExtensionItem
                sequence
                symbols
                onChange
                key={string_of_int(i)}
              />
            )
         |> React.array}
      </ul>;

    <section>
      <h2>
        {string("Keymap extensions")}
        <div className="pull-right">
          <button
            className="btn icon icon-history inline-block-tight"
            onClick=resetToDefault>
            {string("reset to default")}
          </button>
        </div>
      </h2>
      <p>
        {string(
           "Add mappings to the keymap.
If the mapping already exists, it will be prioritized in case that the key sequence corresponds to multiple symbols (e.g. 'r').",
         )}
      </p>
      <AddEntry onChange />
      items
    </section>;
  };
};

[@react.component]
let make = (~hidden) => {
  <section className={"agda-settings-input-method" ++ showWhen(!hidden)}>
    <h1>
      <span className="icon icon-keyboard" />
      <span> {string("Input Method")} </span>
    </h1>
    <hr />
    <SymbolLookup />
    <hr />
    <KeySequenceLookup />
    <hr />
    <ExtendKeymap />
  </section>;
};