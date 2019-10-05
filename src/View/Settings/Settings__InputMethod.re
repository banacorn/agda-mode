open ReasonReact;
open Rebase;

module SymbolLookup = {
  [@react.component]
  let make = () => {
    let (input, setInput) = Hook.useState("");
    let translation = Translator.translate(input);

    let editorRef = React.useRef(None);

    let onChange = _ => {
      switch (React.Ref.current(editorRef)) {
      | Some(editor) => setInput(Atom.TextEditor.getText(editor))
      | None => ()
      };
    };

    let candidateSymbols =
      translation.candidateSymbols
      |> Array.map(symbol =>
           <kbd className="inline-block highlight"> {string(symbol)} </kbd>
         )
      |> Util.React.manyIn("div");

    <section>
      <h2> {string("Symbol lookup")} </h2>
      <p> {string("Enter a key sequence and get corresponding symbols")} </p>
      <MiniEditor
        hidden=false
        value=""
        placeholder="enter some key sequence here, e.g 'lambda'"
        onEditorRef={ref => React.Ref.setCurrent(editorRef, Some(ref))}
        onChange
      />
      // adding className="native-key-bindings" tabIndex=(-1) for text copy
      <div
        id="candidate-symbols" className="native-key-bindings" tabIndex=(-1)>
        candidateSymbols
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
      React.Ref.current(editorRef)
      |> Option.map(Atom.TextEditor.getText)
      |> Option.flatMap(Translator.lookup)
      |> Option.forEach(setInput);
    };
    let results =
      input
      |> Array.map(sequence =>
           <span className="inline-block highlight">
             {string(sequence)}
           </span>
         )
      |> Util.React.manyIn("span");

    <section>
      <h2> {string("Key sequences lookup")} </h2>
      <p> {string("Enter a symbol and get corresponding key sequences")} </p>
      <MiniEditor
        hidden=false
        value=""
        placeholder={j|enter some symbol here, e.g 'λ'|j}
        onEditorRef={ref => React.Ref.setCurrent(editorRef, Some(ref))}
        onChange
      />
      <p id="key-sequences" className="native-key-bindings" tabIndex=(-1)>
        results
      </p>
    </section>;
  };
};

module ExtendKeymap = {
  module ExtensionItem = {
    [@react.component]
    let make = (~sequence: string, ~symbols: array(string)) => {
      // show the buttons when hovered
      let (hovered, setHovered) = Hook.useState(false);
      let onMouseOver = _ => setHovered(true);
      let onMouseLeave = _ => setHovered(false);

      <li onMouseOver onMouseLeave>
        <div className="sequence"> {string(sequence)} </div>
        <div className="symbols">
          {symbols
           |> Array.map(symbol =>
                <kbd className="inline-block highlight">
                  {string(symbol)}
                </kbd>
              )
           |> Util.React.manyInFragment}
        </div>
        <div className={"buttons " ++ (hovered ? "" : "hidden")}>
          <button className="btn icon icon-pencil inline-block-tight">
            {string("modify")}
          </button>
          <button
            className="btn btn-error icon icon-trashcan inline-block-tight">
            {string("delete")}
          </button>
        </div>
      </li>;
    };
  };

  [@react.component]
  let make = () => {
    let items =
      Extension.keymap()
      |> Js.Dict.entries
      |> Array.map(((sequence, symbols)) =>
           <ExtensionItem sequence symbols />
         )
      |> Util.React.manyIn(
           "ul",
           ~props=ReactDOMRe.domProps(~id="extensions", ()),
         );

    <section>
      <h2> {string("Keymap extensions")} </h2>
      <p>
        {string(
           "Add mappings to the keymap.
If the mapping already exists, it will be prioritized in case that the key sequence corresponds to multiple symbols (e.g. 'r').",
         )}
      </p>
      items
    </section>;
  };
};

[@react.component]
let make = (~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-input-method"]
      |> addWhen("hidden", hidden)
      |> serialize
    );

  <section className>
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
