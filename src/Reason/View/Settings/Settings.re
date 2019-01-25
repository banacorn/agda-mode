open ReasonReact;

module URI = Settings__Breadcrumb;
type uri = URI.uri;

type state = {uri};

type action =
  | Navigate(uri);

let initialState = () => {uri: URI.Root};
let reducer = (action: action, _state: state) =>
  switch (action) {
  | Navigate(uri) => Update({uri: uri})
  };

let component = reducerComponent("Settings");

let at = (x, y, classNames) => {
  Util.ClassName.(classNames |> addWhen("hidden", x != y) |> serialize);
};

let make =
    (
      ~inquireConnection: Util.Msg.t((string, string), string),
      ~navigate: Util.Msg.t(uri, unit),
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  didMount: self => {
    navigate
    |> Util.Msg.recv(
         self.onUnmount,
         uri => {
           Js.log("recv navigate");
           self.send(Navigate(uri));
           navigate |> Util.Msg.resolve();
         },
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
          hidden={uri != URI.Connection}
          querying=true
          checked=false
          toggleAgdaConnection=Js.log
          agdaConnected=true
          agdaPath="asdf"
          agdaVersion="???.???"
          supportedProtocol="Emacs"
        />
      </div>
    </section>;
  },
};
