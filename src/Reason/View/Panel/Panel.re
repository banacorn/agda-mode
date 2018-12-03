open ReasonReact;

open Type.Interaction;

type state = {
  maxHeight: int,
  mode,
  isPending: bool,
  settingsViewOn: bool,
};

type jsState = {
  .
  "hidden": bool,
  "isPending": bool,
  "settingsViewOn": bool,
  "mountAt": string,
};

type action =
  | UpdateMaxHeight(int)
  | UpdateIsPending(bool);

let initialState = () => {
  maxHeight: 170,
  mode: Display,
  isPending: false,
  settingsViewOn: false,
};

let reducer = (action, state) =>
  switch (action) {
  | UpdateMaxHeight(maxHeight) => Update({...state, maxHeight})
  | UpdateIsPending(isPending) => Update({...state, isPending})
  };

let component = reducerComponent("Panel");

let make =
    (
      ~onMountAtChange: Type.Interaction.mountTo => unit,
      ~body: Type.Interaction.body,
      ~header: Type.Interaction.header,
      ~mountAt: Type.Interaction.mountAt,
      /* ~jsonBody: Type.Interaction.Emacs.rawBody, */
      /* ~updateHeader: (jsHeaderState => unit) => unit,
         ~updateEmacsBody: (jsEmacsBodyState => unit) => unit,
         ~updateIsPending: (jsState => unit) => unit,
         ~onMountChange: string => unit,
         ~onSettingsViewToggle: bool => unit,
         ~emit, */
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  render: self => {
    let {mode, isPending, settingsViewOn} = self.state;
    let onSettingsViewToggle = (_) => ();
    let mountAtBottom =
      switch (mountAt) {
      | Bottom(_) => true
      | _ => false
      };
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
          mountAtBottom
        />
        <Dashboard
          header
          hidden=false
          isPending
          mountAt
          onMountAtChange
          settingsViewOn
          onSettingsViewToggle
        />
      </section>
      <section className="agda-body-container">
        /* <Context.Emitter.Provider value=emit> */
         <Body state=body hidden=false mountAtBottom /> </section>
    </section>;
    /* </Context.Emitter.Provider> */
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
/* [@bs.deriving abstract]
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
     ); */
