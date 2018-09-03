let answer: int = 43;

let component = ReasonReact.statelessComponent("Link");

let noRange: Type.Agda.Syntax.Position.range = NoRange;

let make = (~range=noRange, ~jump=false, ~hover=false, ~emit, children) => {
  ...component,
  render: _self =>
    <span
      className="link"
      onClick=(
        (_) =>
          if (jump) {
            emit(Type.JumpToRange, range);
          }
      )
      onMouseOver=(
        (_) =>
          if (hover) {
            emit(Type.MouseOver, range);
          }
      )
      onMouseOut=(
        (_) =>
          if (hover) {
            emit(Type.MouseOut, range);
          }
      )>
      ...children
    </span>,
};
