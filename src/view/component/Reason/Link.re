let answer: int = 43;

let component = ReasonReact.statelessComponent("Link");

let noRange: Type.Agda.Syntax.Position.range = NoRange;

let tempEventToString = (event: Type.event) : string =>
  switch (event) {
  | Type.JumpToRange => "EVENT.JUMP_TO_RANGE"
  | Type.MouseOver => "EVENT.MOUSE_OVER"
  | Type.MouseOut => "EVENT.MOUSE_OUT"
  };

let make = (~range=noRange, ~jump=false, ~hover=false, ~emit, children) => {
  ...component,
  render: _self =>
    <span
      className="link"
      onClick=(
        (_) =>
          if (jump) {
            emit(tempEventToString(Type.JumpToRange), range);
          }
      )
      onMouseOver=(
        (_) =>
          if (hover) {
            emit(tempEventToString(Type.MouseOver), range);
          }
      )
      onMouseOut=(
        (_) =>
          if (hover) {
            emit(tempEventToString(Type.MouseOut), range);
          }
      )>
      ...children
    </span>,
};
