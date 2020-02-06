open! Rebase;
open Rebase.Fn;
open Type.View;
open Util.React;

module PanelContainer = {
  // get "article.agda-mode-panel-container", create one if not found
  external fromDomElement: Dom.element => Atom.Workspace.item = "%identity";
  external asElement:
    Webapi.Dom.HtmlElement.t_htmlElement => Webapi.Dom.Element.t =
    "%identity";

  let createForBottom = (): mountingPoint => {
    open Webapi.Dom;
    open DomTokenList;

    // create "article.agda-mode-panel-container"
    // shared by all instances, should only be invoked once!
    let createBottomPanelContainer = (): Element.t => {
      let panelContainer = document |> Document.createElement("article");
      panelContainer |> Element.classList |> add("agda-mode-panel-container");
      Atom.Workspace.addBottomPanel({
        "item": fromDomElement(panelContainer),
        "priority": 0,
        "visible": true,
      })
      |> ignore;
      panelContainer;
    };

    let containers =
      Atom.Workspace.getBottomPanels()
      |> Array.map(Atom.Views.getView)
      |> Array.flatMap(
           HtmlElement.childNodes
           >> NodeList.toArray
           >> Array.filterMap(HtmlElement.ofNode),
         )
      |> Array.filter(elem =>
           elem |> HtmlElement.className == "agda-mode-panel-container"
         );

    switch (containers[0]) {
    | None => Bottom(createBottomPanelContainer())
    | Some(container) => Bottom(asElement(container))
    };
  };

  let fromMountingPoint =
    fun
    | Bottom(element) => element
    | Pane(tab) => tab |> Tab.getElement;
};

[@react.component]
let make =
    (
      ~editors: Editors.t,
      // ~containerElement: Webapi.Dom.Element.t,
      // ~onMountingTargetChange: mountingTarget => unit,
      // ~mountingPoint: mountingPoint,
      // ~hidden: bool,
      ~settingsActivated: bool,
      // ~activated: bool,
      // ~panelRef: ReactDOMRe.Ref.currentDomRef,
      /* Editors */
      // ~onQueryEditorRef: Atom.TextEditor.t => unit,
      ~onInputMethodChange: Event.t(InputMethod.state),
      ~onSettingsViewToggle: bool => unit,
      ~onInquireQuery: Event.t(result(string, MiniEditor.error)),
    ) => {
  let channels = React.useContext(Channels.context);

  ////////////////////////////////////////////
  // header / body / mode
  ////////////////////////////////////////////

  let (header, setHeader) =
    Hook.useState({Header.text: "", style: PlainText});
  let (body, setBody) = Hook.useState(Body.Nothing);
  let (mode, setMode) = Hook.useState(Display);
  let (editorValue, setEditorValue) = Hook.useState("");
  let (editorPlaceholder, setEditorPlaceholder) = Hook.useState("");

  /* display mode! */
  Hook.useChannel(
    ((header, body)) => {
      setMode(Display);
      setHeader(header);
      setBody(body);
      Promise.resolved();
    },
    channels.display,
  );

  Hook.useChannel(
    ((header, placeholder, value)) => {
      setMode(Inquire);
      editors |> Editors.Focus.on(Query);
      setHeader(header);
      setEditorPlaceholder(placeholder);
      setEditorValue(value);

      // after inquiring
      onInquireQuery.once()
      ->Promise.tapOk(_ => {
          setMode(Display);
          editors |> Editors.Focus.on(Source);
        });
    },
    channels.inquire,
  );

  // <SizingHandle>
  let (maxHeight, setMaxHeight) = Hook.useState(170);

  // <InputMethod>
  let (inputMethodActivated, setInputMethodActivation) =
    Hook.useState(false);

  // the spinning wheel
  let (isPending, setIsPending) = Hook.useState(false);
  Hook.useChannel(setIsPending >> Promise.resolved, channels.updateIsPending);

  React.useEffect1(
    () => {
      let destructor =
        onInputMethodChange.on(state =>
          setInputMethodActivation(state.InputMethod.activated)
        );
      Some(destructor);
    },
    [||],
  );

  ////////////////////////////////////////////
  // mounting point
  ////////////////////////////////////////////

  let (mountingPoint, setMountingPoint) =
    Hook.useState(PanelContainer.createForBottom());

  // in case that we need to access the latest mounting point from Hook.useChannel
  // as the closure of the callback of Hook.useChannel is only captured at the first render
  let mountingPointRef = React.useRef(mountingPoint);
  React.Ref.setCurrent(mountingPointRef, mountingPoint);

  // reset the element of editors.query everytime <Panel> got remounted
  // issue #104: https://github.com/banacorn/agda-mode/issues/104
  let queryEditorRef = React.useRef(None);
  React.useEffect1(
    () => {
      editors.query = React.Ref.current(queryEditorRef);
      None;
    },
    [|mountingPoint|],
  );

  let onQueryEditorRef = ref =>
    React.Ref.setCurrent(queryEditorRef, Some(ref));

  let rec mountPanel = (editors: Editors.t, mountingTarget) => {
    let createTab = () =>
      Tab.make(
        ~editor=editors.source,
        ~getTitle=
          () => "[Agda Mode] " ++ Atom.TextEditor.getTitle(editors.source),
        ~path="panel",
        ~onClose=_ => mountAtBottom(),
        ~onOpen=
          (_, _, previousItem) =>
            /* activate the previous pane (which opened this pane item) */
            Atom.Workspace.paneForItem(previousItem)
            |> Rebase.Option.forEach(pane => {
                 pane |> Atom.Pane.activate;
                 pane |> Atom.Pane.activateItem(previousItem);
               }),
        (),
      );
    switch (React.Ref.current(mountingPointRef), mountingTarget) {
    | (Bottom(_), AtBottom) => ()
    | (Bottom(_), AtPane) => setMountingPoint(Pane(createTab()))
    | (Pane(tab), AtBottom) =>
      Tab.kill(tab);
      setMountingPoint(PanelContainer.createForBottom());
    | (Pane(_), AtPane) => ()
    };
  }
  and mountAtPane = () => mountPanel(editors, AtPane)
  and mountAtBottom = () => mountPanel(editors, AtBottom);
  /* toggle docking */
  Hook.useChannel(
    () => {
      switch (React.Ref.current(mountingPointRef)) {
      | Bottom(_) => mountAtPane()
      | Pane(_) => mountAtBottom()
      };
      Promise.resolved();
    },
    channels.toggleDocking,
  );

  ////////////////////////////////////////////
  // <Panel> Activation/Deactivation
  ////////////////////////////////////////////

  let (activated, setActivation) = Hook.useState(false);

  // side-effects
  React.useEffect1(
    () => {
      if (activated) {
        switch (mountingPoint) {
        | Bottom(_) => ()
        | Pane(tab) => Tab.activate(tab)
        };
      };
      None;
    },
    [|activated|],
  );

  // input
  Hook.useChannel(
    () => {
      setActivation(true);
      mountingPointRef
      |> React.Ref.current
      |> PanelContainer.fromMountingPoint
      |> Promise.resolved;
    },
    channels.activatePanel,
  );

  Hook.useChannel(
    () => {
      setActivation(false);
      Promise.resolved();
    },
    channels.deactivatePanel,
  );

  // destroy everything
  let panelRef = React.useRef(Js.Nullable.null);
  Hook.useChannel(
    () => {
      open Webapi.Dom;

      // `stateRef` is permanant
      let mountingPoint = React.Ref.current(mountingPointRef);
      switch (mountingPoint) {
      | Bottom(container) =>
        // removes `.agda-mode-panel` from the `.agda-mode-panel-container`
        let panel = React.Ref.current(panelRef) |> Js.Nullable.toOption;
        switch (panel) {
        | None => ()
        | Some(elem) => container |> Element.removeChild(elem) |> ignore
        };
      | Pane(tab) => Tab.kill(tab)
      };

      Promise.resolved();
    },
    channels.destroy,
  );
  let containerElement = PanelContainer.fromMountingPoint(mountingPoint);

  let hidden =
    switch (mountingPoint) {
    // only show the view when it's loaded and active
    | Bottom(_) => !activated
    | Pane(_) => false
    };

  let onMountingTargetChange = {
    fun
    | AtBottom => mountAtBottom()
    | AtPane => mountAtPane();
  };

  let mountAtBottom =
    switch (mountingPoint) {
    | Bottom(_) => true
    | _ => false
    };
  let style =
    mountAtBottom
      ? Some(
          ReactDOMRe.Style.make(
            ~maxHeight=string_of_int(maxHeight) ++ "px",
            (),
          ),
        )
      : None;
  let id = "agda-mode:" ++ Editors.getID(editors);

  ReactDOMRe.createPortal(
    <section
      ref={ReactDOMRe.Ref.domRef(panelRef)}
      className={"agda-mode-panel" ++ showWhen(!hidden)}
      id>
      <section className="panel-heading agda-header-container">
        <SizingHandle
          onResizeStart=setMaxHeight
          onResizeEnd={height =>
            Js.Global.setTimeout(
              () => {
                setMaxHeight(height);
                Atom.Config.set(
                  "agda-mode.maxBodyHeight",
                  string_of_int(height),
                )
                |> ignore;
              },
              0,
            )
            |> ignore
          }
          mountAtBottom
        />
        <InputMethod
          editors
          panelActivated=activated
          onChange=onInputMethodChange
        />
        <Dashboard
          header
          hidden=inputMethodActivated
          isPending
          mountingPoint
          settingsActivated
          onMountingTargetChange
          onSettingsViewToggle
        />
      </section>
      <section ?style className="agda-body-container">
        <Body body hidden={mode != Display} />
        <MiniEditor
          hidden={mode != Inquire}
          value=editorValue
          placeholder=editorPlaceholder
          grammar="agda"
          onEditorRef=onQueryEditorRef
          onConfirm={result => onInquireQuery.emit(Ok(result))}
          onCancel={() =>
            onInquireQuery.emit(Error(MiniEditor.Cancelled)) |> ignore
          }
        />
      </section>
    </section>,
    containerElement,
  );
};