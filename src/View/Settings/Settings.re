[@bs.config {jsx: 3}];

open ReasonReact;

module URI = Settings__Breadcrumb;
type uri = URI.uri;

let at = (x, y, classNames) => {
  Util.ClassName.(classNames |> addWhen("hidden", x != y) |> serialize);
};

[@react.component]
let make =
    (
      ~inquireConnection: Event.t(unit, unit),
      ~onInquireConnection: Event.t(string, MiniEditor.error),
      ~connection: option(Connection.t),
      ~connectionError: option(Connection.Error.t),
      ~navigate: Event.t(uri, unit),
      ~element: option(Webapi.Dom.Element.t),
    ) => {
  let (uri, setURI) = React.useState(() => URI.Root);

  React.useEffect1(
    () => Some(navigate |> Event.onOk(uri => setURI(_ => uri))),
    [||],
  );

  switch (element) {
  | None => null
  | Some(anchor) =>
    ReactDOMRe.createPortal(
      <section className="agda-settings" tabIndex=(-1)>
        <Settings__Breadcrumb uri onNavigate={uri => setURI(_ => uri)} />
        <div className="agda-settings-pages">
          <ul className={at(URI.Root, uri, ["agda-settings-menu"])}>
            <li onClick={_ => setURI(_ => URI.Connection)}>
              <span className="icon icon-plug"> {string("Connection")} </span>
            </li>
            <li onClick={_ => setURI(_ => URI.Protocol)}>
              <span className="icon icon-comment-discussion">
                {string("Protocol")}
              </span>
            </li>
          </ul>
          <Settings__Connection
            inquireConnection
            onInquireConnection
            connection
            error=connectionError
            hidden={uri != URI.Connection}
          />
        </div>
      </section>,
      anchor,
    )
  };
};
