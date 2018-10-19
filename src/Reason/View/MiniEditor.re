open ReasonReact;

open Rebase;

open Webapi.Dom;

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
      ~onConfirm=(_) => (),
      ~onCancel=() => (),
      ~onFocus=() => (),
      ~onBlur=() => (),
      ~editorRef=(_) => (),
      _children,
    ) => {
  let observeFocus = (self, editor) => {
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
          onFocus();
        } else {
          self.send(Blur);
          onBlur();
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
        /* expose the editor */
        editorRef(editor);
        /* subscribe to Atom's core events */
        let disposable = Atom.CompositeDisposable.make();
        Atom.Environment.Commands.add(
          `DOMElement(Atom.Environment.Views.getView(editor)),
          "core:confirm",
          (~displayName as _, ~description as _, ~hiddenInCommandPalette as _) =>
          onConfirm(editor |> Atom.TextEditor.getText)
        )
        |> Atom.CompositeDisposable.add(disposable);
        Atom.Environment.Commands.add(
          `DOMElement(Atom.Environment.Views.getView(editor)),
          "core:cancel",
          (~displayName as _, ~description as _, ~hiddenInCommandPalette as _) =>
          onCancel()
        )
        |> Atom.CompositeDisposable.add(disposable);
        /* observer the status of focus of the editor */
        observeFocus(self, editor);
        /* value */
        editor |> Atom.TextEditor.setText(value);
        /* placeholder */
        editor |> Atom.TextEditor.setPlaceholderText(placeholder);
      },
    render: self => {
      let className =
        ["mini-editor"]
        |> Util.addClass("hidden", hidden)
        |> Util.toClassName;
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
  editorRef: Atom.TextEditor.t => unit,
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
      ~editorRef=editorRefGet(jsProps),
      [||],
    )
  );
