let component = ReasonReact.statelessComponent("Range");

open Type.Agda.Syntax.Position;

let intervalToString = interval : string =>
  if (interval.start.line === interval.end_.line) {
    string_of_int(interval.start.line)
    ++ ","
    ++ string_of_int(interval.start.col)
    ++ "-"
    ++ string_of_int(interval.end_.col);
  } else {
    string_of_int(interval.start.line)
    ++ ","
    ++ string_of_int(interval.start.col)
    ++ "-"
    ++ string_of_int(interval.end_.line)
    ++ ","
    ++ string_of_int(interval.end_.col);
  };

let rangeToString = (range: range) : string =>
  switch (range) {
  | NoRange => ""
  | Range(None, []) => ""
  | Range(None, xs) =>
    intervalToString({
      start: List.hd(xs).start,
      end_: List.nth(xs, List.length(xs) - 1).end_,
    })
  | Range(Some(filepath), []) => filepath
  | Range(Some(filepath), xs) =>
    filepath
    ++ ":"
    ++ intervalToString({
         start: List.hd(xs).start,
         end_: List.nth(xs, List.length(xs) - 1).end_,
       })
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
        <span className="text-subtle range icon icon-link">
          (ReasonReact.string(rangeToString(range)))
        </span>
      </Link>;
    },
};

type point;

type range;

[@bs.module "atom"] [@bs.new]
external createPoint : (int, int) => point = "Point";

[@bs.module "atom"] [@bs.new]
external createRange : (point, point) => point = "Range";

let toAtomRange = range =>
  switch (range) {
  | Range(_, []) => %bs.raw
                     {| null |}
  | Range(_, xs) =>
    let start = List.hd(xs).start;
    let end_ = List.nth(xs, List.length(xs) - 1).end_;
    createRange(
      createPoint(start.line, start.col),
      createPoint(end_.line, end_.col),
    );
  | _ => %bs.raw
         {| null |}
  };

let toAtomFilepath = range =>
  switch (range) {
  | Range(Some(filepath), _) => filepath
  | _ => %bs.raw
         {| null |}
  };

[@bs.deriving abstract]
type jsProps = {
  range: Type.Agda.Syntax.Position.range,
  emit: (string, Type.Agda.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~range=rangeGet(jsProps), ~emit=emitGet(jsProps), [||])
  );
