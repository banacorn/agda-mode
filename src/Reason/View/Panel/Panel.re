open ReasonReact;
open Rebase;

open Type.View;

type state = {
  maxHeight: int,
  isPending: bool,
  inputMethodActivated: bool,
};

type action =
  | UpdateMaxHeight(int)
  | UpdateIsPending(bool)
  | UpdateInputMethodActivation(bool)
  | MouseEvent(mouseEvent);

let initialState = () => {
  maxHeight: 170,
  isPending: false,
  inputMethodActivated: false,
};

let reducer = (action, state) =>
  switch (action) {
  | UpdateMaxHeight(maxHeight) => Update({...state, maxHeight})
  | UpdateIsPending(isPending) => Update({...state, isPending})
  | UpdateInputMethodActivation(activated) =>
    Update({...state, inputMethodActivated: activated})
  | MouseEvent(JumpToRange(range)) =>
    SideEffects(_ => Js.log("JumpToRange"))
  | MouseEvent(MouseOver(range)) => SideEffects(_ => Js.log("MouseOver"))
  | MouseEvent(MouseOut(range)) => SideEffects(_ => Js.log("MouseOut"))
  };

let component = reducerComponent("Panel");

let make =
    (
      ~editors: Editors.t,
      ~element: Webapi.Dom.Element.t,
      ~onMountAtChange: mountTo => unit,
      ~body: body,
      ~header: Header.t,
      ~mountAt: mountAt,
      ~mode: mode,
      ~hidden: bool,
      /* Editors */
      ~onInquireQuery: Event.t(string, MiniEditor.error),
      ~onEditorRef: Atom.TextEditor.t => unit,
      ~editorPlaceholder: string,
      ~editorValue: string,
      ~interceptAndInsertKey: Event.t(string, unit),
      ~activateInputMethod: Event.t(bool, unit),
      ~activateSettingsView: Event.t(bool, unit),
      ~onSettingsViewToggle: bool => unit,
      /* ~onGeneralEditorChange: Editors.miniEditor => unit,
         ~onGeneralEditorConfirm: string => unit,
         ~generalEditor: Editors.miniEditor, */
      /* ~onQueryConfirm: string => unit, */
      /* ~jsonBody: Emacs.rawBody, */
      /* ~updateHeader: (jsHeaderState => unit) => unit,
         ~updateEmacsBody: (jsEmacsBodyState => unit) => unit,
         ~updateIsPending: (jsState => unit) => unit,
         ~onMountChange: string => unit,
         /**/
         ~emit, */
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  render: self => {
    let {isPending, inputMethodActivated, maxHeight} = self.state;
    let mountAtBottom =
      switch (mountAt) {
      | Bottom(_) => true
      | _ => false
      };
    let className =
      Util.ClassName.([] |> addWhen("hidden", hidden) |> serialize);
    ReactDOMRe.createPortal(
      <MouseEmitter.Provider value={ev => self.send(MouseEvent(ev))}>
        <section className>
          <section className="panel-heading agda-header-container">
            <SizingHandle
              onResizeStart={height => self.send(UpdateMaxHeight(height))}
              onResizeEnd={height =>
                Js.Global.setTimeout(
                  () => {
                    self.send(UpdateMaxHeight(height));
                    Atom.Environment.Config.set(
                      "agda-mode.maxBodyHeight",
                      string_of_int(height),
                    );
                  },
                  0,
                )
                |> ignore
              }
              mountAtBottom
            />
            <InputMethod
              editors
              interceptAndInsertKey
              activateInputMethod
              onActivationChange={activated =>
                self.send(UpdateInputMethodActivation(activated))
              }
            />
            <Dashboard
              header
              hidden=inputMethodActivated
              isPending
              mountAt
              onMountAtChange
              onSettingsViewToggle
              activateSettingsView
            />
          </section>
          <section className="agda-body-container">
            <Body body maxHeight hidden={mode != Display} mountAtBottom />
            <MiniEditor
              hidden={mode != Inquire}
              value=editorValue
              placeholder=editorPlaceholder
              grammar="agda"
              editorRef=onEditorRef
              onConfirm={result => onInquireQuery |> Event.resolve(result)}
              onCancel={(.) =>
                onInquireQuery |> Event.reject(MiniEditor.Cancelled) |> ignore
              }
            />
          </section>
        </section>
      </MouseEmitter.Provider>,
      element,
    );
  },
};
