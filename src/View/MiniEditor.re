// Binding to Atom's <atom-text-editor>

open Rebase;
open Fn;
open Util.React;

type error =
  | Cancelled;

/* observer the status of focus of the editor */
let observeFocus = (setFocused: bool => unit, editor) => {
  open Webapi.Dom;

  /* monitoring the "is-focus" class in the classList  */
  let observer =
    MutationObserver.make((mutations, _) => {
      let focusedNow =
        mutations
        |> Array.exists(
             MutationRecord.target
             >> Element.ofNode
             >> Option.map(
                  Element.classList >> DomTokenList.contains("is-focused"),
                )
             >> Option.mapOr(id, false),
           );
      /* modify the state */
      setFocused(focusedNow);
    });
  let config = {
    "attributes": true, /* we are only interested in the class list */
    "childList": false,
    "subtree": false,
  };
  /* start observing */
  let element = Atom.Views.getView(editor);
  observer |> MutationObserver.observe(element, config);

  /* stop observing */
  Some(() => observer |> MutationObserver.disconnect);
};

// converting from a React ref to a <TextEditor>
let ofTextEditor: ReasonReact.reactRef => Atom.TextEditor.t =
  r => ReasonReact.refToJsObj(r)##getModel();

[@react.component]
let make =
    (
      ~value="",
      ~placeholder="",
      ~hidden,
      ~grammar="",
      ~onConfirm=_ => (),
      ~onChange=_ => (),
      ~onCancel=_ => (),
      ~onFocus=_ => (),
      ~onBlur=_ => (),
      ~onEditorRef=_ => (),
    ) => {
  let (focused, setFocused) = Hook.useState(false);
  let (editorRef, setEditorRef) = Hook.useState(None);
  let editorElem = React.useRef(None);

  /* value */
  React.useEffect1(
    _ => {
      React.Ref.current(editorElem)
      |> Option.map(ofTextEditor)
      |> Option.forEach(Atom.TextEditor.setText(value));
      None;
    },
    [|value|],
  );
  /* placeholder */
  React.useEffect1(
    _ => {
      React.Ref.current(editorElem)
      |> Option.map(ofTextEditor)
      |> Option.forEach(Atom.TextEditor.setPlaceholderText(placeholder));
      None;
    },
    [|placeholder|],
  );

  React.useEffect1(
    () =>
      React.Ref.current(editorElem)
      |> Option.map(ofTextEditor)
      |> Option.flatMap(editor => {
           // storing the Editor
           setEditorRef(Some(editor));
           /* WARNING: TextEditor.setGrammar is DEPRECATED!!! */
           /* pass the grammar down to enable input method */
           if (grammar === "agda") {
             Atom.Grammars.grammarForScopeName("source.agda")
             |> Option.forEach(grammar =>
                  try (editor |> Atom.TextEditor.setGrammar(grammar)) {
                  | _ => () /* do nothing when we fail to load the grammar */
                  }
                );
             (); /* do nothing when we fail to load the grammar */
           };
           /* expose the editor */
           onEditorRef(editor);
           /* subscribe to Atom's core events */
           let disposables = Atom.CompositeDisposable.make();

           let element = Atom.Views.getView(editor);
           Atom.Commands.add(`HtmlElement(element), "core:confirm", _event =>
             onConfirm(editor |> Atom.TextEditor.getText)
           )
           |> Atom.CompositeDisposable.add(disposables);
           Atom.Commands.add(`HtmlElement(element), "core:cancel", _event =>
             onCancel()
           )
           |> Atom.CompositeDisposable.add(disposables);

           editor
           |> Atom.TextEditor.onDidChange(onChange)
           |> Atom.CompositeDisposable.add(disposables);

           Some(() => disposables |> Atom.CompositeDisposable.dispose);
         }),
    [||],
  );

  /* observer the status of focus of the editor */
  React.useEffect1(
    () => editorRef |> Option.flatMap(observeFocus(setFocused)),
    [|editorRef|],
  );

  // triggering callbacks
  React.useEffect1(
    () => {
      if (focused) {
        onFocus();
      } else {
        onBlur();
      };
      None;
    },
    [|focused|],
  );

  ReactDOMRe.createElementVariadic(
    "atom-text-editor",
    ~props=
      ReactDOMRe.objToDOMProps({
        "class": "mini-editor" ++ showWhen(!hidden),
        "mini": "true",
        "ref": editorElem,
      }),
    [||],
  );
};
