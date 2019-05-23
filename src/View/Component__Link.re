open Type.Location.Range;

open Type.View;

[@react.component]
let make =
    (
      ~target=RangeLink(NoRange),
      ~jump=false,
      ~hover=false,
      ~className=[],
      ~children,
    ) => {
  let target_ =
    switch (target) {
    | RangeLink(NoRange)
    | RangeLink(Range(_, [||])) => None
    | HoleLink(index) => Some(HoleLink(index))
    | RangeLink(range) => Some(RangeLink(range))
    };

  let emit = React.useContext(Type.View.Mouse.emitter);

  switch (target_) {
  | None =>
    <span className={String.concat(" ", ["link", ...className])}>
      children
    </span>
  | Some(t) =>
    <span
      className={String.concat(" ", ["link", ...className])}
      onClick={_ =>
        if (jump) {
          emit(JumpToTarget(t));
        }
      }
      onMouseOver={_ =>
        if (hover) {
          emit(MouseOver(t));
        }
      }
      onMouseOut={_ =>
        if (hover) {
          emit(MouseOut(t));
        }
      }>
      children
    </span>
  };
};
