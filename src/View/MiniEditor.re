open ReasonReact;

open Rebase;

type error =
  | Cancelled;

module Model = {
  type t = {
    value: string,
    placeholder: string,
    mutable ref: option(Atom.TextEditor.t),
    result: Event.t(string, error),
  };

  let make = () => {
    value: "",
    placeholder: "",
    ref: None,
    result: Event.make(),
  };
  let inquire = self => {
    self.result |> Event.once;
  };
  let answer = (x, self) => self.result |> Event.emitOk(x);
  let reject = (x, self) => self.result |> Event.emitError(x);

  let setRef = (ref, self) => {
    self.ref = Some(ref);
  };

  let setValue = (value, self) => {
    switch (self.ref) {
    | None => ()
    | Some(editor) => editor |> Atom.TextEditor.setText(value)
    };
  };
};

let focus = editor => {
  Webapi.Dom.(Atom.Environment.Views.getView(editor) |> HtmlElement.focus);
};

type state = {
  focused: bool,
  ref: ref(option(Atom.TextEditor.t)),
};

type action =
  | Focus
  | Blur;

let setRef = (r, {ReasonReact.state}) =>
  state.ref :=
    Js.Nullable.toOption(r)
    |> Option.map(r => ReasonReact.refToJsObj(r)##getModel());

let component = ReasonReact.reducerComponent("MiniEditor");

let make =
    (
      ~value="",
      ~placeholder="",
      ~hidden,
      ~grammar="",
      ~onConfirm=_ => (),
      ~onCancel=(.) => (),
      ~onFocus=(.) => (),
      ~onBlur=(.) => (),
      ~editorRef=_ => (),
      _children,
    ) => {
  let observeFocus = (self, editor) => {
    open Webapi.Dom;

    /* monitoring the "is-focus" class in the classList  */
    let observer =
      MutationObserver.make((mutations, _) => {
        let focusedNow =
          mutations
          |> Array.exists(m =>
               m
               |> MutationRecord.target
               |> Element.ofNode
               |> Option.map(elem =>
                    elem
                    |> Element.classList
                    |> DomTokenList.contains("is-focused")
                  )
               |> Option.mapOr(Fn.id, false)
             );
        /* trigger the actions and the events  */
        if (focusedNow) {
          self.send(Focus);
          onFocus(.);
        } else {
          self.send(Blur);
          onBlur(.);
        };
      });
    let config = {
      "attributes": true, /* we are only interested in the class list */
      "childList": false,
      "subtree": false,
    };
    /* start observing */
    let element = Atom.Environment.Views.getView(editor);
    observer |> MutationObserver.observe(element, config);
    /* stop observing */
    self.onUnmount(() => observer |> MutationObserver.disconnect);
  };
  {
    ...component,
    initialState: () => {
      focused: false,
      ref: ref(None: option(Atom.TextEditor.t)),
    },
    reducer: (action, state) =>
      switch (action) {
      | Blur => ReasonReact.Update({...state, focused: false})
      | Focus => ReasonReact.Update({...state, focused: true})
      },
    didMount: self =>
      switch (self.state.ref^) {
      | None => ()
      | Some(editor) =>
        /* WARNING: TextEditor.setGrammar is DEPRECATED!!! */
        /* pass the grammar down to enable input method */
        if (grammar === "agda") {
          let agdaGrammar =
            Atom.Environment.Grammar.grammarForScopeName("source.agda");
          try (editor |> Atom.TextEditor.setGrammar(agdaGrammar)) {
          | _ => () /* do nothing when we fail to load the grammar */
          };
        };
        /* expose the editor */
        editorRef(editor);
        /* subscribe to Atom's core events */
        let disposables = Atom.CompositeDisposable.make();
        Atom.Environment.Commands.add(
          `HtmlElement(Atom.Environment.Views.getView(editor)),
          "core:confirm",
          _event =>
          onConfirm(editor |> Atom.TextEditor.getText)
        )
        |> Atom.CompositeDisposable.add(disposables);
        Atom.Environment.Commands.add(
          `HtmlElement(Atom.Environment.Views.getView(editor)),
          "core:cancel",
          _event =>
          onCancel(.)
        )
        |> Atom.CompositeDisposable.add(disposables);
        self.onUnmount(() => disposables |> Atom.CompositeDisposable.dispose);
        /* observer the status of focus of the editor */
        observeFocus(self, editor);
        /* value */
        editor |> Atom.TextEditor.setText(value);
        /* placeholder */
        editor |> Atom.TextEditor.setPlaceholderText(placeholder);
      },
    render: self => {
      let className =
        Util.ClassName.(
          ["mini-editor"] |> addWhen("hidden", hidden) |> serialize
        );
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
