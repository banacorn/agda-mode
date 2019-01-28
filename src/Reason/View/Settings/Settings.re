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
      ~inquireConnection: Util.Event.t((string, string)),
      ~onInquireConnection: Util.Event.t(string),
      ~navigate: Util.Event.t(uri),
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  didMount: self => {
    Util.Promise.(
      navigate
      |> Util.Event.on
      |> Util.Event.destroyWhen(self.onUnmount)
      |> thenDrop(uri =>
           self.send(
             Navigate(uri),
             /* navigate |> Util.Event.resolve(); */
           )
         )
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
