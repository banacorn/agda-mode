[@bs.config {jsx: 3}];

open ReasonReact;
open Rebase;

[@react.component]
let make =
    (
      ~header: Type.View.Header.t,
      ~hidden: bool,
      ~isPending: bool,
      ~mountAt: Type.View.mountAt,
      ~settingsView: option(Tab.t),
      ~onMountAtChange: Type.View.mountTo => unit,
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
             Atom.Environment.Tooltips.add(
               Atom.Environment.Views.getView(settingsButton),
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
             );
           Some(() => disposable |> Atom.Disposable.dispose);
         }),
    [||],
  );

  let settingsOn = settingsView |> Option.isSome;
  open Util.ClassName;
  let classList = ["agda-header"] |> addWhen("hidden", hidden) |> serialize;
  let headerClassList =
    switch (header.style) {
    | PlainText => ""
    | Error => "text-error"
    | Info => "text-info"
    | Success => "text-success"
    | Warning => "text-warning"
    };
  let spinnerClassList =
    ["loading", "loading-spinner-tiny", "inline-block"]
    |> addWhen("pending", isPending)
    |> serialize;
  let settingsViewClassList =
    ["no-btn"] |> addWhen("activated", settingsOn) |> serialize;
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
          onClick={_ => onSettingsViewToggle(!settingsOn)}
          ref={ReactDOMRe.Ref.domRef(settingsButtonRef)}>
          <span className="icon icon-settings" />
        </button>
      </li>
      <li>
        <button
          className=toggleMountingPosition
          onClick={_ =>
            switch (mountAt) {
            | Pane(_) => onMountAtChange(Type.View.ToBottom)
            | _ => onMountAtChange(Type.View.ToPane)
            }
          }
          ref={ReactDOMRe.Ref.domRef(dockingButtonRef)}>
          <span className="icon icon-versions" />
        </button>
      </li>
    </ul>
  </div>;
};
