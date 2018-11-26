open ReasonReact;

open Util;

type state = {
  settingsButtonRef: ref(option(Dom.element)),
  dockingButtonRef: ref(option(Dom.element)),
};

type action;

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
      ~onMountChange: Type.Interaction.mountAt => unit,
      ~settingsViewOn: bool,
      ~onSettingsViewToggle: bool => unit,
      _children,
    ) => {
  ...component,
  initialState: () => {
    settingsButtonRef: ref(None),
    dockingButtonRef: ref(None),
  },
  reducer: (_: action, _) => NoUpdate,
  didMount: self => {
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
    let classList =
      ["agda-header"] |> addClass("hidden", hidden) |> toClassName;
    let headerClassList = "text-" ++ header.style;
    let spinnerClassList =
      ["loading", "loading-spinner-tiny", "inline-block"]
      |> addClass("pending", isPending)
      |> toClassName;
    let settingsViewClassList =
      ["no-btn"] |> addClass("activated", settingsViewOn) |> toClassName;
    let toggleMountingPosition =
      ["no-btn"]
      |> addClass("activated", mountAt === Type.Interaction.Pane)
      |> toClassName;
    <div className=classList>
      <h1 className=headerClassList> (string(header.text)) </h1>
      <ul className="agda-dashboard">
        <li> <span id="spinner" className=spinnerClassList /> </li>
        <li>
          <button
            className=settingsViewClassList
            onClick=((_) => onSettingsViewToggle(! settingsViewOn))
            ref=(self.handle(setSettingsButtonRef))>
            <span className="icon icon-settings" />
          </button>
        </li>
        <li>
          <button
            className=toggleMountingPosition
            onClick=(
              (_) =>
                mountAt === Type.Interaction.Pane ?
                  onMountChange(Type.Interaction.Bottom) :
                  onMountChange(Type.Interaction.Pane)
            )
            ref=(self.handle(setDockingButtonRef))>
            <span className="icon icon-versions" />
          </button>
        </li>
      </ul>
    </div>;
  },
};
