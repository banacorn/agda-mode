open ReasonReact;

open Type.Interaction;

type state = {
  header,
  body,
  mountAt,
  mode,
  isPending: bool,
  settingsViewOn: bool,
};

type jsHeaderState = {
  .
  "text": string,
  "style": string,
};

type jsEmacsBodyState = {
  .
  "kind": string,
  "header": string,
  "body": string,
};

type jsJSONBodyState = {
  .
  "kind": string,
  "rawJSON": Js.Json.t,
  "rawString": string,
};

type jsState = {
  .
  "hidden": bool,
  "isPending": bool,
  "settingsViewOn": bool,
  "mountAt": string,
};

type action =
  | UpdateHeader(header)
  | UpdateJSONBody(Type.Interaction.JSON.rawBody)
  | UpdateEmacsBody(Type.Interaction.Emacs.rawBody)
  | UpdateMaxHeight(int)
  | UpdateIsPending(bool);

let initialState = () => {
  header: {
    text: "",
    style: "",
  },
  body: {
    maxHeight: 170,
    raw: Unloaded,
  },
  mountAt: Bottom,
  mode: Display,
  isPending: false,
  settingsViewOn: false,
};

let reducer = (action, state) =>
  switch (action) {
  | UpdateHeader(header) => Update({...state, header})
  | UpdateJSONBody(raw) =>
    Update({
      ...state,
      body: {
        ...state.body,
        raw: RawJSON(raw),
      },
    })
  | UpdateEmacsBody(raw) =>
    Update({
      ...state,
      body: {
        ...state.body,
        raw: RawEmacs(raw),
      },
    })
  | UpdateMaxHeight(maxHeight) =>
    Update({
      ...state,
      body: {
        ...state.body,
        maxHeight,
      },
    })
  | UpdateIsPending(isPending) => Update({...state, isPending})
  };

let component = reducerComponent("Panel");

let make =
    (
      ~updateHeader: (jsHeaderState => unit) => unit,
      ~updateJSONBody: (jsJSONBodyState => unit) => unit,
      ~updateEmacsBody: (jsEmacsBodyState => unit) => unit,
      ~updateIsPending: (jsState => unit) => unit,
      ~onMountChange: string => unit,
      ~onSettingsViewToggle: bool => unit,
      ~emit,
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  render: self => {
    let {header, body, mode, isPending, mountAt, settingsViewOn} = self.state;
    updateHeader(state =>
      self.send(UpdateHeader({text: state##text, style: state##style}))
    );
    updateJSONBody(state =>
      self.send(
        UpdateJSONBody({
          kind: state##kind,
          rawJSON: state##rawJSON,
          rawString: state##rawString,
        }),
      )
    );
    updateEmacsBody(state =>
      self.send(
        UpdateEmacsBody({
          kind: state##kind,
          header: state##header,
          body: state##body,
        }),
      )
    );
    updateIsPending(state => self.send(UpdateIsPending(state##isPending)));
    <section>
      <section className="panel-heading agda-header-container">
        <SizingHandle
          onResizeStart=(height => self.send(UpdateMaxHeight(height)))
          onResizeEnd=(
            height =>
              Js.Global.setTimeout(
                () => {
                  self.send(UpdateMaxHeight(height));
                  Atom.Environment.Config.set(
                    "agda-mode.maxBodyHeight",
                    string_of_int(height),
                  );
                },
                0,
              )
              |> ignore
          )
          atBottom=(mountAt == Bottom)
        />
        <Dashboard
          header
          hidden=false
          isPending
          mountAt
          onMountChange=(
            mountAt =>
              switch (mountAt) {
              | Bottom => onMountChange("bottom")
              | Pane => onMountChange("pane")
              | Nowhere => onMountChange("nowhere")
              }
          )
          settingsViewOn
          onSettingsViewToggle
        />
      </section>
      <section className="agda-body-container">
        <Context.Emitter.Provider value=emit>
          <Body
            state=body
            hidden=(mode != Display)
            mountAtBottom=(mountAt == Bottom)
          />
        </Context.Emitter.Provider>
      </section>
    </section>;
    /* <MiniEditor
         hidden=(View.Mode.Query !== mode)
         value=this.props.query.value
         placeholder=this.props.query.placeholder
         grammar="agda"
         editorRef=(editor => core.view.editors.general.resolve(editor))
         onFocus=(() => core.view.editors.setFocus("general"))
         onBlur=(() => core.view.editors.setFocus("main"))
         onConfirm=(
           result => {
             /* core.view.editors.answerGeneral(result);
                this.props.handelQueryValueChange(result);
                core.view.editors.focusMain();
                this.props.deactivateMiniEditor();
                core.inputMethod.confirm(); */
           }
         )
         onCancel=(
           () => {
             /* core.view.editors.rejectGeneral();
                core.view.editors.focusMain()
                this.props.deactivateMiniEditor();
                core.inputMethod.cancel(); */
           }
         )
       /> */
  },
};

[@bs.deriving abstract]
type jsProps = {
  updateHeader: (jsHeaderState => unit) => unit,
  updateJSONBody: (jsJSONBodyState => unit) => unit,
  updateEmacsBody: (jsEmacsBodyState => unit) => unit,
  updateIsPending: (jsState => unit) => unit,
  onMountChange: string => unit,
  onSettingsViewToggle: bool => unit,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  wrapReasonForJs(~component, jsProps =>
    make(
      ~updateHeader=updateHeaderGet(jsProps),
      ~updateJSONBody=updateJSONBodyGet(jsProps),
      ~updateEmacsBody=updateEmacsBodyGet(jsProps),
      ~updateIsPending=updateIsPendingGet(jsProps),
      ~onMountChange=onMountChangeGet(jsProps),
      ~onSettingsViewToggle=onSettingsViewToggleGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
