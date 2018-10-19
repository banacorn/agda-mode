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
      ~header: string,
      ~style: string,
      ~hidden: bool,
      ~isPending: bool,
      ~mountAt: string,
      ~onMountChange: string => unit,
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
    let headerClassList = "text-" ++ style;
    let spinnerClassList =
      ["loading", "loading-spinner-tiny", "inline-block"]
      |> addClass("pending", isPending)
      |> toClassName;
    let settingsViewClassList =
      ["no-btn"] |> addClass("activated", settingsViewOn) |> toClassName;
    let toggleMountingPosition =
      ["no-btn"] |> addClass("activated", mountAt === "pane") |> toClassName;
    <div className=classList>
      <h1 className=headerClassList> (string(header)) </h1>
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
                mountAt === "pane" ?
                  onMountChange("bottom") : onMountChange("pane")
            )
            ref=(self.handle(setDockingButtonRef))>
            <span className="icon icon-versions" />
          </button>
        </li>
      </ul>
    </div>;
  },
};

[@bs.deriving abstract]
type jsProps = {
  header: string,
  style: string,
  hidden: bool,
  isPending: bool,
  mountAt: string,
  onMountChange: string => unit,
  settingsViewOn: bool,
  onSettingsViewToggle: bool => unit,
};

let jsComponent =
  wrapReasonForJs(~component, jsProps =>
    make(
      ~header=headerGet(jsProps),
      ~style=styleGet(jsProps),
      ~hidden=hiddenGet(jsProps),
      ~isPending=isPendingGet(jsProps),
      ~mountAt=mountAtGet(jsProps),
      ~onMountChange=onMountChangeGet(jsProps),
      ~settingsViewOn=settingsViewOnGet(jsProps),
      ~onSettingsViewToggle=onSettingsViewToggleGet(jsProps),
      [||],
    )
  );
