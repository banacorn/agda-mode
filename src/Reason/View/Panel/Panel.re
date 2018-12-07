open ReasonReact;

open Type.Interaction;

type state = {
  maxHeight: int,
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
      ~onMountAtChange: mountTo => unit,
      ~body: body,
      ~header: header,
      ~mountAt: mountAt,
      ~mode: mode,
      ~query: query,
      /* Editors */
      ~onUpdateEditors: Editors.t => unit,
      ~editors: Editors.t,
      /* ~onQueryConfirm: string => unit, */
      /* ~jsonBody: Emacs.rawBody, */
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
    let {isPending, settingsViewOn} = self.state;
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

          <Body body hidden=(mode != Display) mountAtBottom />
          <MiniEditor
            hidden=(mode != Query)
            value=query.value
            placeholder=query.placeholder
            grammar="agda"
            editorRef=(
              ref =>
                onUpdateEditors({
                  ...editors,
                  general: {
                    ...editors.general,
                    ref: Some(ref),
                  },
                })
            )
            onFocus=(
              (.) =>
                onUpdateEditors({
                  ...editors,
                  general: {
                    ...editors.general,
                    focused: true,
                  },
                })
            )
            onBlur=(
              (.) =>
                onUpdateEditors({
                  ...editors,
                  general: {
                    ...editors.general,
                    focused: false,
                  },
                })
            )
            onConfirm=(
              result =>
                ()
                /* onQueryConfirm(
                     result,
                     /* core.view.editors.answerGeneral(result);
                        this.props.handelQueryValueChange(result);
                        core.view.editors.focusMain();
                        this.props.deactivateMiniEditor();
                        core.inputMethod.confirm(); */
                   ) */
            )
            /* onConfirm=(
                 result => {
                   onQueryConfirm(result);
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
               ) */
          />
        </section>
    </section>;
    /* </Context.Emitter.Provider> */
  },
};
