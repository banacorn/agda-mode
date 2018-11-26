open ReasonReact;

open Rebase;

open Webapi;

type state = {
  height: int,
  handleRef: ref(option(Dom.Element.t)),
};

type action =
  | UpdateHeight(int);

let component = reducerComponent("SizingHandle");

let setHandleRef = (r, {state}) =>
  state.handleRef := Js.Nullable.toOption(r);

let calculateBodyHeight =
    (r: ref(option(Dom.Element.t)), handleY: int)
    : option(int) =>
  switch (r^) {
  | Some(handleRef) =>
    let top =
      (Dom.Element.getBoundingClientRect(handleRef) |> Dom.DomRect.top) + 51; /* border-width: 1px */
    Dom.Document.querySelector("atom-panel-container.footer", Dom.document)
    |> Option.flatMap(element => {
         let bottom =
           element |> Dom.Element.getBoundingClientRect |> Dom.DomRect.top;
         if (top > 0) {
           Some(bottom - handleY - 51);
         } else {
           None;
         };
       });
  | None => None
  };

let make =
    (
      ~onResizeStart: int => unit,
      ~onResizeEnd: int => unit,
      ~atBottom: bool,
      _children,
    ) => {
  ...component,
  initialState: () => {height: 0, handleRef: ref(None)},
  reducer: (UpdateHeight(height), state) => Update({...state, height}),
  render: self =>
    atBottom ?
      <div className="sizing-handle-anchor">
        <div
          className="sizing-handle native-key-bindings"
          ref=(self.handle(setHandleRef))
          onDragStart=(
            ev => {
              let clientY = ev |> ReactEvent.Mouse.clientY;
              self.send(UpdateHeight(clientY));
              switch (calculateBodyHeight(self.state.handleRef, clientY)) {
              | Some(y) => onResizeStart(y)
              | _ => ()
              };
            }
          )
          onDragEnd=(
            ev => {
              let clientY = ev |> ReactEvent.Mouse.clientY;
              self.send(UpdateHeight(clientY));
              switch (calculateBodyHeight(self.state.handleRef, clientY)) {
              | Some(y) => onResizeEnd(y)
              | _ => ()
              };
            }
          )
          /* to enable Drag & Drop */
          draggable=true
          tabIndex=(-1)
        />
      </div> :
      null,
};
