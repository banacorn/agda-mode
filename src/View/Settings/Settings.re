open ReasonReact;
open Util.React;
open Rebase.Fn;

module URI = Settings__Breadcrumb;
type uri = URI.uri;

let at = (x, y, classNames) => {
  classNames ++ showWhen(x == y);
};

[@react.component]
let make =
    // ~inquireConnection: Event.t(unit, unit),
    // ~onInquireConnection: Event.t(string, MiniEditor.error),
    (
      ~targetURI: uri,
      ~debug: Type.View.Debug.state,
      ~element: option(Webapi.Dom.Element.t),
    ) => {
  let channels = React.useContext(Channels.context);
  let ((connection, connectionError), setConnectionAndError) =
    Hook.useState((None, None));
  Hook.useChannel(
    setConnectionAndError >> Promise.resolved,
    channels.updateConnection,
  );

  let (uri, setURI) = Hook.useState(targetURI);
  React.useEffect1(
    () => {
      setURI(targetURI);
      None;
    },
    [|targetURI|],
  );

  let inDevMode = Atom.inDevMode();
  switch (element) {
  | None => null
  | Some(anchor) =>
    ReactDOMRe.createPortal(
      <section className="agda-settings" tabIndex=(-1)>
        <Settings__Breadcrumb uri onNavigate=setURI />
        <div className="agda-settings-pages">
          <ul className={at(URI.Root, uri, "agda-settings-menu")}>
            <li onClick={_ => setURI(URI.Connection)}>
              <span className="icon icon-plug"> {string("Connection")} </span>
            </li>
            <li onClick={_ => setURI(URI.Log)}>
              <span className="icon icon-comment-discussion">
                {string("Log")}
              </span>
            </li>
            <li onClick={_ => setURI(URI.InputMethod)}>
              <span className="icon icon-keyboard">
                {string("Input Method")}
              </span>
            </li>
            {inDevMode
               ? <li onClick={_ => setURI(URI.Debug)}>
                   <span className="icon icon-terminal">
                     {string("Debug")}
                   </span>
                 </li>
               : null}
          </ul>
          <Settings__Connection
            connection
            // inquireConnection
            // onInquireConnection
            error=connectionError
            hidden={uri != URI.Connection}
          />
          <Settings__Log connection hidden={uri != URI.Log} />
          <Settings__InputMethod hidden={uri != URI.InputMethod} />
          <Settings__Debug debug hidden={uri != URI.Debug} />
        </div>
      </section>,
      anchor,
    )
  };
};
