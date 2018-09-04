let answer: int = 43;

let component = ReasonReact.statelessComponent("Link");

let noRange: Type.Syntax.Position.range = NoRange;

open Type.AgdaMode;

let tempEventToString = (event: event) : string =>
  switch (event) {
  | JumpToRange => "EVENT.JUMP_TO_RANGE"
  | MouseOver => "EVENT.MOUSE_OVER"
  | MouseOut => "EVENT.MOUSE_OUT"
  };

let make = (~range=noRange, ~jump=false, ~hover=false, ~emit, children) => {
  ...component,
  render: _self =>
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
    </span>,
};
