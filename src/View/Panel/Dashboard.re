open ReasonReact;
open Util.React;
open Rebase;

[@react.component]
let make =
    (
      ~header: Type.View.Header.t,
      ~hidden: bool,
      ~isPending: bool,
      ~mountingPoint: Type.View.mountingPoint,
      ~settingsActivated: bool,
      ~onMountingTargetChange: Type.View.mountingTarget => unit,
      ~onSettingsViewToggle: bool => unit,
    ) => {
  let settingsButtonRef = React.useRef(Js.Nullable.null);
  let dockingButtonRef = React.useRef(Js.Nullable.null);

  React.useEffect1(
    () =>
      settingsButtonRef
      |> React.Ref.current
      |> Js.Nullable.toOption
      |> Option.flatMap(settingsButton => {
           let disposable =
             Atom.Tooltips.add(
               Atom.Views.getView(settingsButton),
               {
                 "title": "settings",
                 "delay": {
                   "show": 100,
                   "hide": 1000,
                 },
               },
             );
           Some(() => disposable |> Atom.Disposable.dispose);
         }),
    [||],
  );

  React.useEffect1(
    () =>
      dockingButtonRef
      |> React.Ref.current
      |> Js.Nullable.toOption
      |> Option.flatMap(dockingButton => {
           let disposable =
             Atom.Tooltips.add(
               Atom.Views.getView(dockingButton),
               {
                 "title": "toggle panel docking position",
                 "delay": {
                   "show": 300,
                   "hide": 1000,
                 },
                 "keyBindingCommand": "agda-mode:toggle-docking",
               },
             );
           Some(() => disposable |> Atom.Disposable.dispose);
         }),
    [||],
  );

  let headerClassList =
    switch (header.style) {
    | PlainText => ""
    | Error => "text-error"
    | Info => "text-info"
    | Success => "text-success"
    | Warning => "text-warning"
    };
  let spinnerClassList =
    "loading loading-spinner-tiny inline-block" ++ when_(isPending, "pending");
  let settingsViewClassList =
    "no-btn" ++ when_(settingsActivated, "activated");
  let toggleMountingPosition =
    "no-btn"
    ++ when_(
         switch (mountingPoint) {
         | Pane(_) => true
         | _ => false
         },
         "activated",
       );

  <div className={"agda-header" ++ showWhen(!hidden)}>
    <h1 className=headerClassList> {string(header.text)} </h1>
    <ul className="agda-dashboard">
      <li> <span id="spinner" className=spinnerClassList /> </li>
      <li>
        <button
          className=settingsViewClassList
          onClick={_ => onSettingsViewToggle(!settingsActivated)}
          ref={ReactDOMRe.Ref.domRef(settingsButtonRef)}>
          <span className="icon icon-settings" />
        </button>
      </li>
      <li>
        <button
          className=toggleMountingPosition
          onClick={_ =>
            switch (mountingPoint) {
            | Pane(_) => onMountingTargetChange(Type.View.AtBottom)
            | _ => onMountingTargetChange(Type.View.AtPane)
            }
          }
          ref={ReactDOMRe.Ref.domRef(dockingButtonRef)}>
          <span className="icon icon-versions" />
        </button>
      </li>
    </ul>
  </div>;
};
