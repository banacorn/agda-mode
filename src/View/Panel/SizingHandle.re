[@bs.config {jsx: 3}];

open ReasonReact;

open Rebase;

open Webapi;

let calculateBodyHeight = (handleRef, handleY: int): option(int) => {
  handleRef
  |> React.Ref.current
  |> Js.Nullable.toOption
  |> Option.flatMap(elem => {
       let top =
         (Dom.Element.getBoundingClientRect(elem) |> Dom.DomRect.top) + 51; /* border-width: 1px */
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
     });
};

[@react.component]
let make =
    (
      ~onResizeStart: int => unit,
      ~onResizeEnd: int => unit,
      ~mountAtBottom: bool,
    ) => {
  let handleRef = React.useRef(Js.Nullable.null);
  mountAtBottom
    ? <div className="sizing-handle-anchor">
        <div
          className="sizing-handle native-key-bindings"
          ref={ReactDOMRe.Ref.domRef(handleRef)}
          onDragStart={ev =>
            ev
            |> ReactEvent.Mouse.clientY
            |> calculateBodyHeight(handleRef)
            |> Option.forEach(onResizeStart)
          }
          onDragEnd={ev =>
            ev
            |> ReactEvent.Mouse.clientY
            |> calculateBodyHeight(handleRef)
            |> Option.forEach(onResizeEnd)
          }
          /* to enable Drag & Drop */
          draggable=true
          tabIndex=(-1)
        />
      </div>
    : null;
};
