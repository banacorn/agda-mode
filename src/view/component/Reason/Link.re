let noRange: Type.Syntax.Position.range = NoRange;

open Type.AgdaMode;

let tempEventToString = (event: event) : string =>
  switch (event) {
  | JumpToRange => "EVENT.JUMP_TO_RANGE"
  | MouseOver => "EVENT.MOUSE_OVER"
  | MouseOut => "EVENT.MOUSE_OUT"
  };

let component = ReasonReact.statelessComponent("Link");

let make = (~range=noRange, ~jump=false, ~hover=false, children) => {
  ...component,
  render: _self =>
    switch (range) {
    | NoRange
    | Range(_, []) => <span className="link"> ...children </span>
    | _ =>
      <Context.Emitter.Consumer>
        ...(
             emit =>
               <span
                 className="link"
                 onClick=(
                   (_) =>
                     if (jump) {
                       emit(tempEventToString(JumpToRange), range);
                     }
                 )
                 onMouseOver=(
                   (_) =>
                     if (hover) {
                       emit(tempEventToString(MouseOver), range);
                     }
                 )
                 onMouseOut=(
                   (_) =>
                     if (hover) {
                       emit(tempEventToString(MouseOut), range);
                     }
                 )>
                 ...children
               </span>
           )
      </Context.Emitter.Consumer>
    },
};
