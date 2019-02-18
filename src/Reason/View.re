open ReasonReact;
open Rebase;

open Type.View;

module Event = Event;

/************************************************************************************************************/

module Handles = {
  type t = {
    updateHeader: Event.t(Header.t, unit),
    updateBody: Event.t(body, unit),
    updateMode: Event.t(mode, unit),
    updateMountTo: Event.t(mountTo, unit),
    activatePanel: Event.t(bool, unit),
    updateConnection: Event.t(option(Connection.t), unit),
    inquireConnection: Event.t((option(Connection.error), string), unit),
    onInquireConnection: Event.t(string, MiniEditor.error),
    onInquireQuery: Event.t(string, MiniEditor.error),
    inquireQuery: Event.t((string, string), unit),
    activateSettingsView: Event.t(bool, unit),
    onSettingsView: Event.t(bool, unit),
    navigateSettingsView: Event.t(Settings.uri, unit),
    destroy: Event.t(unit, unit),
    /* Input Method */
    activateInputMethod: Event.t(bool, unit),
    interceptAndInsertKey: Event.t(string, unit),
  };

  let hook = (f, handle) => f := handle;

  /* creates all refs and return them */
  let make = () => {
    let activatePanel = Event.make();
    let updateHeader = Event.make();
    let updateBody = Event.make();
    let updateMode = Event.make();
    let updateMountTo = Event.make();
    let updateConnection = Event.make();
    let inquireConnection = Event.make();
    let onInquireConnection = Event.make();
    let onInquireQuery = Event.make();
    let inquireQuery = Event.make();
    let activateSettingsView = Event.make();
    let onSettingsView = Event.make();
    let navigateSettingsView = Event.make();
    let destroy = Event.make();
    let interceptAndInsertKey = Event.make();
    let activateInputMethod = Event.make();

    {
      activatePanel,
      updateHeader,
      updateBody,
      updateMode,
      updateMountTo,
      updateConnection,
      inquireConnection,
      onInquireConnection,
      onInquireQuery,
      inquireQuery,
      activateSettingsView,
      onSettingsView,
      navigateSettingsView,
      destroy,
      activateInputMethod,
      interceptAndInsertKey,
    };
  };
};

/************************************************************************************************************/

let createElement = (): Webapi.Dom.Element.t => {
  open Webapi.Dom;
  open DomTokenListRe;
  let element = document |> Document.createElement("article");
  element |> Element.classList |> add("agda-mode");
  Atom.Environment.Workspace.addBottomPanel({
    "item": element,
    "visible": true,
  })
  |> ignore;
  element;
};

type state = {
  header: Header.t,
  body,
  maxHeight: int,
  mountAt,
  activated: bool,
  settingsView: option(Tab.t),
  mode,
};

let initialState = () => {
  {
    header: {
      text: "",
      style: PlainText,
    },
    body: Nothing,
    maxHeight: 170,
    mountAt: Bottom(createElement()),
    activated: false,
    settingsView: None,
    mode: Display,
  };
};

type action =
  /* | InquireConnection(string, string) */
  | Focus(Editors.sort)
  /* Query Editor related */
  | SetQueryRef(Atom.TextEditor.t)
  /* | InquireQuery(string, string) */
  /* Settings Tab related */
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  /*  */
  | UpdateMountAt(mountAt)
  | MountTo(mountTo)
  | Activate
  | Deactivate
  /*  */
  | UpdateHeader(Header.t)
  | UpdateBody(body)
  | UpdateMode(mode);

let mountPanel = (editors: Editors.t, self, mountTo) => {
  let createTab = () =>
    Tab.make(
      ~editor=editors.source,
      ~getTitle=
        () => "[Agda Mode] " ++ Atom.TextEditor.getTitle(editors.source),
      ~onClose=_ => self.send(MountTo(ToBottom)),
      ~onOpen=
        (_, _, previousItem) => {
          /* activate the previous pane (which opened this pane item) */
          let pane = Atom.Environment.Workspace.paneForItem(previousItem);
          pane |> Atom.Pane.activate;
          pane |> Atom.Pane.activateItem(previousItem);
        },
      (),
    );
  switch (self.state.mountAt, mountTo) {
  | (Bottom(_), ToBottom) => ()
  | (Bottom(_), ToPane) => self.send(UpdateMountAt(Pane(createTab())))
  | (Pane(tab), ToBottom) =>
    tab.kill();
    self.send(UpdateMountAt(Bottom(createElement())));
  | (Pane(_), ToPane) => ()
  };
};

let reducer = (editors: Editors.t, handles: Handles.t, action, state) => {
  switch (action) {
  | Activate =>
    switch (state.mountAt) {
    | Bottom(_) => Update({...state, activated: true})
    | Pane(tab) =>
      UpdateWithSideEffects({...state, activated: true}, _ => tab.activate())
    }
  | Deactivate => Update({...state, activated: false})
  | SetQueryRef(ref) =>
    SideEffects(_self => editors.query |> MiniEditor.Model.setRef(ref))
  | Focus(sort) => SideEffects(_self => editors |> Editors.Focus.on(sort))
  | MountTo(mountTo) =>
    SideEffects(self => mountPanel(editors, self, mountTo))
  | ToggleSettingsTab(open_) =>
    SideEffects(
      self =>
        switch (state.settingsView) {
        | None =>
          if (open_) {
            let tab =
              Tab.make(
                ~editor=editors.source,
                ~getTitle=
                  () =>
                    "[Settings] " ++ Atom.TextEditor.getTitle(editors.source),
                ~onOpen=
                  (element, _, _) => {
                    open Handles;
                    let {
                      inquireConnection,
                      onInquireConnection,
                      updateConnection,
                    } = handles;
                    ReactDOMRe.render(
                      <Settings
                        inquireConnection
                        onInquireConnection
                        updateConnection
                        navigate={handles.navigateSettingsView}
                      />,
                      element,
                    );
                    /* <Settings> is opened */
                    handles.onSettingsView |> Event.resolve(true);
                  },
                ~onClose=
                  element => {
                    self.send(ToggleSettingsTab(false));
                    ReactDOMRe.unmountComponentAtNode(element);

                    /* <Settings> is closed */
                    handles.onSettingsView |> Event.resolve(false);
                  },
                /* handles.activateSettingsView |> Event.send(false); */
                (),
              );
            self.send(UpdateSettingsView(Some(tab)));
          }
        | Some(tab) =>
          if (open_) {
            /* <Settings> is opened */
            handles.onSettingsView |> Event.resolve(true);
          } else {
            tab.kill();
            self.send(UpdateSettingsView(None));
            /* <Settings> is closed */
            handles.onSettingsView |> Event.resolve(false);
          }
        },
    )
  | UpdateSettingsView(settingsView) => Update({...state, settingsView})
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
  | UpdateHeader(header) => Update({...state, header})
  | UpdateBody(body) => Update({...state, body})
  | UpdateMode(mode) => Update({...state, mode})
  };
};

let component = reducerComponent("View");

let make = (~editors: Editors.t, ~handles: Handles.t, _children) => {
  ...component,
  initialState,
  reducer: reducer(editors, handles),
  didMount: self => {
    open Event;

    /* activate/deactivate <Panel> */
    handles.activatePanel
    |> onOk(activate => self.send(activate ? Activate : Deactivate))
    |> destroyWhen(self.onUnmount);

    /* update <Header> */
    handles.updateHeader
    |> onOk(header => self.send(UpdateHeader(header)))
    |> destroyWhen(self.onUnmount);

    /* update <Body> */
    handles.updateBody
    |> onOk(body => self.send(UpdateBody(body)))
    |> destroyWhen(self.onUnmount);

    /* update MountTo */
    handles.updateMountTo
    |> onOk(where => self.send(MountTo(where)))
    |> destroyWhen(self.onUnmount);

    /* update the mode of <Panel> */
    handles.updateMode
    |> onOk(mode => self.send(UpdateMode(mode)))
    |> destroyWhen(self.onUnmount);

    handles.inquireQuery
    |> onOk(payload => {
         Js.log(payload);

         self.send(UpdateMode(Query));
         self.send(Focus(Query));
       })
    |> destroyWhen(self.onUnmount);

    handles.onInquireQuery
    |> onOk(result => {
         self.send(UpdateMode(Display));
         self.send(Focus(Source));
       })
    |> destroyWhen(self.onUnmount);

    /* handles.inquireQuery
       |> Event.recv(self.onUnmount)
       |> thenDrop(((placeholder, value)) =>
            self.send(
              InquireQuery(placeholder, value),
              /* handles.inquireQuery
                 |> Event.handlePromise(
                      MiniEditor.Model.inquire(self.state.editors.query),
                    ); */
            )
          ); */

    /* destroy everything */
    handles.destroy
    |> onOk(_ => Js.log("destroy!"))
    |> destroyWhen(self.onUnmount);

    /* opening/closing <Settings> */
    handles.activateSettingsView
    |> onOk(activate => self.send(ToggleSettingsTab(activate)))
    |> destroyWhen(self.onUnmount);
  },
  render: self => {
    let {header, body, mountAt, mode, activated} = self.state;
    let element: Webapi.Dom.Element.t =
      switch (mountAt) {
      | Bottom(element) => element
      | Pane(tab) => tab.element
      };
    let hidden =
      switch (mountAt) {
      | Bottom(_) => !activated
      | Pane(_) => false
      };
    <>
      <Panel
        editors
        element
        header
        body
        mountAt
        hidden
        onMountAtChange={mountTo => self.send(MountTo(mountTo))}
        mode
        onInquireQuery={handles.onInquireQuery}
        /* editors */
        onEditorFocused={focused =>
          self.send(focused ? Focus(Query) : Focus(Source))
        }
        onEditorRef={ref => self.send(SetQueryRef(ref))}
        editorValue={editors.query.value}
        editorPlaceholder={editors.query.placeholder}
        interceptAndInsertKey={handles.interceptAndInsertKey}
        activateInputMethod={handles.activateInputMethod}
        activateSettingsView={handles.activateSettingsView}
        onSettingsViewToggle={status => self.send(ToggleSettingsTab(status))}
      />
    </>;
  },
};

let initialize = editors => {
  open Webapi.Dom;
  let element = document |> Document.createElement("article");
  let handles = Handles.make();
  let component = ReasonReact.element(make(~editors, ~handles, [||]));
  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  handles;
};
