let noRange: Type.Syntax.Position.range = NoRange;

open Type.View;

let component = ReasonReact.statelessComponent("Link");

let make =
    (~range=noRange, ~jump=false, ~hover=false, ~className=[], children) => {
  ...component,
  render: _self =>
    switch (range) {
    | NoRange
    | Range(_, []) =>
      <span className=(String.concat(" ", ["link", ...className]))>
        ...children
      </span>
    | _ =>
      <MouseEmitter.Consumer>
        ...(
             emit =>
               <span
                 className=(String.concat(" ", ["link", ...className]))
                 onClick=(
                   (_) =>
                     if (jump) {
                       emit(JumpToRange(range));
                     }
                 )
                 onMouseOver=(
                   (_) =>
                     if (hover) {
                       emit(MouseOver(range));
                     }
                 )
                 onMouseOut=(
                   (_) =>
                     if (hover) {
                       emit(MouseOut(range));
                     }
                 )>
                 ...children
               </span>
           )
      </MouseEmitter.Consumer>
    },
};
