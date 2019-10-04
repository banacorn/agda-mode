open ReasonReact;
open Rebase;

[@react.component]
let make = (~hidden) => {
  let (keySequence, setKeySequence) = Hook.useState("");
  let (symbolLookup, setSymbolLookup) = Hook.useState([||]);
  let translation = Translator.translate(keySequence);

  let keyEditorRef = React.useRef(None);
  let symbolEditorRef = React.useRef(None);

  React.useEffect1(
    _ => {
      Js.log(translation);
      None;
    },
    [|keySequence|],
  );

  let onKeyEditorChange = _ => {
    switch (React.Ref.current(keyEditorRef)) {
    | Some(editor) => setKeySequence(Atom.TextEditor.getText(editor))
    | None => ()
    };
  };

  let onSymbolEditorChange = _ => {
    React.Ref.current(symbolEditorRef)
    |> Option.map(Atom.TextEditor.getText)
    |> Option.flatMap(Translator.lookup)
    |> Option.forEach(setSymbolLookup);
  };

  let className =
    Util.ClassName.(
      ["agda-settings-input-method"]
      |> addWhen("hidden", hidden)
      |> serialize
    );

  let candidateSymbols =
    translation.candidateSymbols
    |> Array.map(symbol =>
         <span className="inline-block highlight"> {string(symbol)} </span>
       )
    |> Util.React.manyIn("span");

  let symbolLookupResult =
    symbolLookup
    |> Array.map(sequence =>
         <span className="inline-block highlight"> {string(sequence)} </span>
       )
    |> Util.React.manyIn("span");

  <section className>
    <h1>
      <span className="icon icon-keyboard" />
      <span> {string("Input Method")} </span>
    </h1>
    <hr />
    <h2> {string("Symbol lookup")} </h2>
    <p> {string("Enter a key sequence and get corresponding symbols")} </p>
    <p>
      <MiniEditor
        hidden=false
        value=""
        placeholder="enter some key sequence here, e.g 'lambda'"
        onEditorRef={ref => React.Ref.setCurrent(keyEditorRef, Some(ref))}
        onChange=onKeyEditorChange
      />
    </p>
    // adding className="native-key-bindings" tabIndex=(-1) for text copy
    <p id="candidate-symbols" className="native-key-bindings" tabIndex=(-1)>
      candidateSymbols
    </p>
    <hr />
    <h2> {string("Key sequences lookup")} </h2>
    <p> {string("Enter a symbol and get corresponding key sequences")} </p>
    <p>
      <MiniEditor
        hidden=false
        value=""
        placeholder="enter some symbol here, e.g 'λ'"
        onEditorRef={ref => React.Ref.setCurrent(symbolEditorRef, Some(ref))}
        onChange=onSymbolEditorChange
      />
    </p>
    <p id="key-sequences" className="native-key-bindings" tabIndex=(-1)>
      symbolLookupResult
    </p>
    <hr />
  </section>;
};
