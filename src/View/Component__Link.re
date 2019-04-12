open Type.Location.Range;

open Type.View;

let component = ReasonReact.statelessComponent("Link");

let make =
    (
      ~target=RangeLink(NoRange),
      ~jump=false,
      ~hover=false,
      ~className=[],
      children,
    ) => {
  ...component,
  render: _self => {
    let target_ =
      switch (target) {
      | RangeLink(NoRange)
      | RangeLink(Range(_, [||])) => None
      | HoleLink(index) => Some(HoleLink(index))
      | RangeLink(range) => Some(RangeLink(range))
      };

    switch (target_) {
    | None =>
      <span className={String.concat(" ", ["link", ...className])}>
        ...children
      </span>
    | Some(t) =>
      <MouseEmitter.Consumer>
        ...{emit =>
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
            ...children
          </span>
        }
      </MouseEmitter.Consumer>
    };
  },
};
