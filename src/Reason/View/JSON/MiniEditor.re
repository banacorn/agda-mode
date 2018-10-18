open ReasonReact;

[@bs.val] [@bs.scope ("atom", "commands")]
external add : (ReasonReact.reactRef, string, unit => unit) => unit = "add";

type grammar;

[@bs.val] [@bs.scope ("atom", "grammars")]
external grammarForScopeName : string => grammar = "grammarForScopeName";

type mutationRecord = {. "attributeName": string};

type observerConfig = {
  .
  "attributes": bool,
  "childList": bool,
  "subtree": bool,
};

type mutationObserver = {
  .
  [@bs.meth] "observe": (ReasonReact.reactRef, observerConfig) => unit,
  [@bs.meth] "disconnect": unit => unit,
};

[@bs.new]
external createMutationObserver :
  (array(mutationRecord) => unit) => mutationObserver =
  "MutationObserver";

type state = {
  focused: bool,
  ref: ref(option(ReasonReact.reactRef)),
};

type action =
  | Focus
  | Blur;

let setRef = (theRef, {ReasonReact.state}) =>
  state.ref := Js.Nullable.toOption(theRef);

let component = ReasonReact.reducerComponent("MiniEditor");

let make =
    (
      ~value="",
      ~placeholder="",
      ~hidden,
      ~onConfirm=(_) => (),
      ~onCancel=() => (),
      ~onFocus=() => (),
      ~onBlur=() => (),
      ~grammar="",
      ~editorRef=(_) => (),
      _children,
    ) => {
  let observeFocus = (self, r) => {
    /* monitoring the "is-fucos" class in the classList  */
    let observer =
      createMutationObserver(mutations => {
        let focusedNow =
          mutations
          |> Array.to_list
          |> List.filter(m => m##attributeName === "class")
          |> Array.of_list
          |> Js.Array.every(_m =>
               ReasonReact.refToJsObj(r)##className
               |> Js.String.includes("is-focused")
             );
        /* trigger the actions and the events  */
        if (focusedNow) {
          self.send(Focus);
          onFocus();
        } else {
          self.send(Blur);
          onBlur();
        };
      });
    let config: observerConfig = {
      "attributes": true, /* we are only interested in the class list */
      "childList": false,
      "subtree": false,
    };
    /* start observing */
    observer##observe(r, config);
    /* stop observing */
    self.onUnmount(() => observer##disconnect());
  };
  {
    ...component,
    initialState: () => {focused: false, ref: ref(None)},
    reducer: (action, state) =>
      switch (action) {
      | Blur => ReasonReact.Update({...state, focused: false})
      | Focus => ReasonReact.Update({...state, focused: true})
      },
    didMount: self =>
      switch (self.state.ref^) {
      | None => ()
      | Some(r) =>
        /* expose the editor */
        editorRef(ReasonReact.refToJsObj(r));
        /* pass the grammar down to enable input method */
        if (grammar === "agda") {
          let agdaGrammar = grammarForScopeName("source.agda");
          try (
            ReasonReact.refToJsObj(r)##getModel()##setGrammar(agdaGrammar)
          ) {
          | _ => () /* do nothing when we fail to load the grammar */
          };
        };
        /* subscribe to Atom's core events */
        add(r, "core:confirm", () =>
          onConfirm(ReasonReact.refToJsObj(r)##getModel()##getText())
        );
        add(r, "core:cancel", () => onCancel());
        /* observer the status of focus of the editor */
        observeFocus(self, r);
        /* value */
        ReasonReact.refToJsObj(r)##getModel()##setText(value);
        /* placeholder */
        ReasonReact.refToJsObj(r)##getModel()##setPlaceholderText(
          placeholder,
        );
      },
    render: self => {
      let className =
        hidden ?
          ["mini-editor", "hidden"] |> String.concat(" ") :
          ["mini-editor"] |> String.concat(" ");
      ReactDOMRe.createElement(
        "atom-text-editor",
        ~props=
          ReactDOMRe.objToDOMProps({
            "class": className,
            "mini": "true",
            "ref": self.handle(setRef),
          }),
        [||],
      );
    },
  };
};

[@bs.deriving abstract]
type jsProps = {
  value: string,
  placeholder: string,
  hidden: bool,
  onConfirm: string => unit,
  onCancel: unit => unit,
  onFocus: unit => unit,
  onBlur: unit => unit,
  grammar: string,
  editorRef: {. "a": int} => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~value=valueGet(jsProps),
      ~placeholder=placeholderGet(jsProps),
      ~hidden=hiddenGet(jsProps),
      ~onConfirm=onConfirmGet(jsProps),
      ~onCancel=onCancelGet(jsProps),
      ~onFocus=onFocusGet(jsProps),
      ~onBlur=onBlurGet(jsProps),
      ~grammar=grammarGet(jsProps),
      ~editorRef=editorRefGet(jsProps),
      [||],
    )
  );
