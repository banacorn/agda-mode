open ReasonReact;

module URI = Settings__Breadcrumb;
type uri = URI.uri;

type state = {
  uri,
  connection: option(Connection.t),
};

type action =
  | UpdateConnection(option(Connection.t))
  | Navigate(uri);

let initialState = () => {uri: URI.Root, connection: None};
let reducer = (action: action, state: state) =>
  switch (action) {
  | UpdateConnection(connection) => Update({...state, connection})
  | Navigate(uri) => Update({...state, uri})
  };

let component = reducerComponent("Settings");

let at = (x, y, classNames) => {
  Util.ClassName.(classNames |> addWhen("hidden", x != y) |> serialize);
};

let make =
    (
      ~inquireConnection: Event.t((option(Connection.error), string), unit),
      ~onInquireConnection: Event.t(Connection.viewAction, MiniEditor.error),
      ~connection: option(Connection.t),
      ~navigate: Event.t(uri, unit),
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  didMount: self => {
    Event.
      /* navigation */
      (
        navigate
        |> onOk(uri => self.send(Navigate(uri)))
        |> destroyWhen(self.onUnmount)
      );
  },
  render: self => {
    let {uri} = self.state;
    <section className="agda-settings" tabIndex=(-1)>
      <Settings__Breadcrumb
        uri
        onNavigate={uri => self.send(Navigate(uri))}
      />
      <div className="agda-settings-pages">
        <ul className={at(URI.Root, uri, ["agda-settings-menu"])}>
          <li onClick={_ => self.send(Navigate(URI.Connection))}>
            <span className="icon icon-plug"> {string("Connection")} </span>
          </li>
          <li onClick={_ => self.send(Navigate(URI.Protocol))}>
            <span className="icon icon-comment-discussion">
              {string("Protocol")}
            </span>
          </li>
        </ul>
        <Settings__Connection
          inquireConnection
          onInquireConnection
          connection
          hidden={uri != URI.Connection}
        />
      </div>
    </section>;
  },
};
