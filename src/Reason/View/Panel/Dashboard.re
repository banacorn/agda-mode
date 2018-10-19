open ReasonReact;

open Util;

let component = statelessComponent("Dashboard");

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
  render: _self => {
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
