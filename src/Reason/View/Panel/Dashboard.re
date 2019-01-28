open ReasonReact;

type state = {
  settingsButtonRef: ref(option(Dom.element)),
  dockingButtonRef: ref(option(Dom.element)),
  settingsView: bool,
};

let initialState = () => {
  settingsButtonRef: ref(None),
  dockingButtonRef: ref(None),
  settingsView: false,
};

type action =
  | SettingsViewOn
  | SettingsViewOff;

let reducer = (action, state) =>
  switch (action) {
  | SettingsViewOn => Update({...state, settingsView: true})
  | SettingsViewOff => Update({...state, settingsView: false})
  };

let setSettingsButtonRef = (r, {state}) =>
  state.settingsButtonRef := Js.Nullable.toOption(r);

let setDockingButtonRef = (r, {state}) =>
  state.dockingButtonRef := Js.Nullable.toOption(r);

let component = reducerComponent("Dashboard");

let make =
    (
      ~header: Type.Interaction.header,
      ~hidden: bool,
      ~isPending: bool,
      ~mountAt: Type.Interaction.mountAt,
      ~onMountAtChange: Type.Interaction.mountTo => unit,
      ~onSettingsViewToggle: bool => unit,
      ~activateSettingsView: Util.Event.t(bool),
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  didMount: self => {
    Util.Event.(
      activateSettingsView
      |> on(open_ => self.send(open_ ? SettingsViewOn : SettingsViewOff))
      |> destroyWhen(self.onUnmount)
    );

    switch (self.state.settingsButtonRef^) {
    | None => ()
    | Some(settingsButton) =>
      let disposables = Atom.CompositeDisposable.make();
      Atom.Environment.Tooltips.add(
        Atom.Environment.Views.getView(settingsButton),
        {
          "title": "settings",
          "delay": {
            "show": 100,
            "hide": 1000,
          },
        },
      )
      |> Atom.CompositeDisposable.add(disposables);
      self.onUnmount(() => disposables |> Atom.CompositeDisposable.dispose);
    };
    switch (self.state.dockingButtonRef^) {
    | None => ()
    | Some(dockingButton) =>
      let disposables = Atom.CompositeDisposable.make();
      Atom.Environment.Tooltips.add(
        Atom.Environment.Views.getView(dockingButton),
        {
          "title": "toggle panel docking position",
          "delay": {
            "show": 300,
            "hide": 1000,
          },
          "keyBindingCommand": "agda-mode:toggle-docking",
        },
      )
      |> Atom.CompositeDisposable.add(disposables);
      self.onUnmount(() => disposables |> Atom.CompositeDisposable.dispose);
    };
  },
  render: self => {
    open Util.ClassName;
    let classList =
      ["agda-header"] |> addWhen("hidden", hidden) |> serialize;
    let headerClassList = "text-" ++ header.style;
    let spinnerClassList =
      ["loading", "loading-spinner-tiny", "inline-block"]
      |> addWhen("pending", isPending)
      |> serialize;
    let settingsViewClassList =
      ["no-btn"]
      |> addWhen("activated", self.state.settingsView)
      |> serialize;
    let toggleMountingPosition =
      ["no-btn"]
      |> addWhen(
           "activated",
           switch (mountAt) {
           | Pane(_) => true
           | _ => false
           },
         )
      |> serialize;
    <div className=classList>
      <h1 className=headerClassList> {string(header.text)} </h1>
      <ul className="agda-dashboard">
        <li> <span id="spinner" className=spinnerClassList /> </li>
        <li>
          <button
            className=settingsViewClassList
            onClick={
              self.handle((_, self) =>
                if (self.state.settingsView) {
                  onSettingsViewToggle(false);
                  self.send(SettingsViewOff);
                } else {
                  onSettingsViewToggle(true);
                  self.send(SettingsViewOn);
                }
              )
            }
            ref={self.handle(setSettingsButtonRef)}>
            <span className="icon icon-settings" />
          </button>
        </li>
        <li>
          <button
            className=toggleMountingPosition
            onClick={_ =>
              switch (mountAt) {
              | Pane(_) => onMountAtChange(Type.Interaction.ToBottom)
              | _ => onMountAtChange(Type.Interaction.ToPane)
              }
            }
            ref={self.handle(setDockingButtonRef)}>
            <span className="icon icon-versions" />
          </button>
        </li>
      </ul>
    </div>;
  },
};
