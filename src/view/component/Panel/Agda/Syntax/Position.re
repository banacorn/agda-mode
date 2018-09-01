let component = ReasonReact.statelessComponent("Range");

open Type.Agda.Syntax.Position;

let rangeToString = (range: range) : string =>
  switch (range) {
  | NoRange => ""
  | Range(filepath, [||]) => filepath
  | Range(filepath, intervals) =>
    map(
      interval =>
        if (interval.start.line === interval.end_.line) {
          interval.start.line
          ++ ","
          ++ interval.start.col
          ++ "-"
          ++ interval.end_.col;
        } else {
          interval.start.line
          ++ ","
          ++ interval.start.col
          ++ "-"
          ++ interval.end_.line
          ++ ","
          ++ interval.end_.col;
        },
      intervals,
    )
  };

let make = (~range, ~emit, ~abbr=false, _children) => {
  ...component,
  render: _self =>
    if (abbr) {
      <Link jump=true emit range>
        <span className="text-subtle range icon icon-link" />
      </Link>;
    } else {
      <Link jump=true emit range>
        <span className="text-subtle range icon icon-link" />
      </Link>;
    },
};

/* let rangeToAtomRanges = range => map((),range)
   static toAtomRanges(range: Syntax.Position.Range): Atom.Range[] {
       return range.intervals.map(({ start, end }) => new Atom.Range(
           new Atom.Point(start[0] - 1, start[1] - 1),
           new Atom.Point(end[0] - 1, end[1] - 1),
       ));
   } */
[@bs.deriving abstract]
type jsProps = {
  range: Type.Agda.Syntax.Position.range,
  emit: Type.event => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~range=jsProps##rangeGet, ~emit=jsProps##emitGet, [||])
  );
