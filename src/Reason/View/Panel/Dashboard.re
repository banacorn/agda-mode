open ReasonReact;

open Rebase;

open Util;

let component = statelessComponent("Dashboard");

let make =
    (
      ~isPending: bool,
      ~mountAt: string,
      ~onMountChange: string => unit,
      ~settingsViewOn: bool,
      ~onSettingsViewToggle: bool => unit,
      _children,
    ) => {
  ...component,
  render: _self => {
    let spinnerClassList =
      ["loading", "loading-spinner-tiny", "inline-block"]
      |> addClass("pending", isPending)
      |> toClassName;
    let settingsViewClassList =
      ["no-btn"] |> addClass("activated", settingsViewOn) |> toClassName;
    let toggleMountingPosition =
      ["no-btn"] |> addClass("activated", mountAt === "pane") |> toClassName;
    <ul className="agda-dashboard">
      <li> <span id="spinner" className=spinnerClassList /> </li>
      <li>
        <button
          className=settingsViewClassList
          onClick=((_) => onSettingsViewToggle(! settingsViewOn))>
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
          )>
          <span className="icon icon-versions" />
        </button>
      </li>
    </ul>;
  },
};

[@bs.deriving abstract]
type jsProps = {
  isPending: bool,
  mountAt: string,
  onMountChange: string => unit,
  settingsViewOn: bool,
  onSettingsViewToggle: bool => unit,
};

let jsComponent =
  wrapReasonForJs(~component, jsProps =>
    make(
      ~isPending=isPendingGet(jsProps),
      ~mountAt=mountAtGet(jsProps),
      ~onMountChange=onMountChangeGet(jsProps),
      ~settingsViewOn=settingsViewOnGet(jsProps),
      ~onSettingsViewToggle=onSettingsViewToggleGet(jsProps),
      [||],
    )
  );
