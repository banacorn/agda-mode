open ReasonReact;
open Rebase;

[@react.component]
let make = (~hidden) => {
  let (keySequence, setKeySequence) = Hook.useState("");
  let translation = Translator.translate(keySequence);

  let editorRef = React.useRef(None);

  React.useEffect1(
    _ => {
      Js.log(translation);
      None;
    },
    [|keySequence|],
  );

  let onChange = _ => {
    switch (React.Ref.current(editorRef)) {
    | Some(editor) => setKeySequence(Atom.TextEditor.getText(editor))
    | None => ()
    };
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
        onEditorRef={ref => {
          Js.log("set!!!");
          React.Ref.setCurrent(editorRef, Some(ref));
        }}
        onChange
      />
    </p>
    // adding className="native-key-bindings" tabIndex=(-1) for text copy
    <p id="candidate-symbols" className="native-key-bindings" tabIndex=(-1)>
      candidateSymbols
    </p>
    <hr />
    <h2> {string("Key sequences lookup")} </h2>
    <p> {string("Enter a symbol and get corresponding key sequences")} </p>
    <hr />
  </section>;
};
