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
           <span className="inline-block highlight"> {string(symbol)} </span>
         )
      |> Util.React.manyIn("span");

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
      <p id="candidate-symbols" className="native-key-bindings" tabIndex=(-1)>
        candidateSymbols
      </p>
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
      <p> results </p>
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
  </section>;
};
