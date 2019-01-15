open ReasonReact;

open Type.Interaction;

module URI = Breadcrumb;

type state = {uri: URI.uri};

type action =
  | Navigate(URI.uri);

let initialState = () => {uri: URI.Root};
let reducer = (action: action, state: state) =>
  switch (action) {
  | Navigate(uri) => Update({...state, uri})
  };

let component = reducerComponent("Settings");

let at = (x, y, classNames) => {
  Util.ClassName.(classNames |> addWhen("hidden", x != y) |> serialize);
};

let make = (~editors, ~onConnectionEditorRef, _children) => {
  ...component,
  initialState,
  reducer,
  render: self => {
    let {uri} = self.state;
    <section className="agda-settings" tabIndex=(-1)>
      <Breadcrumb uri onNavigate={uri => self.send(Navigate(uri))} />
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
        <Connection
          editors
          onConnectionEditorRef
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
