let component = ReasonReact.statelessComponent("Range");

open Type.Syntax.Position;

open Util;

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

let fuseIntervals = (a, b) => {
  let start =
    if (a.start.pos > b.start.pos) {
      b.start;
    } else {
      a.start;
    };
  let end_ =
    if (a.end_.pos > b.end_.pos) {
      a.end_;
    } else {
      b.end_;
    };
  {start, end_};
};

let fuse = (a, b) => {
  let mergeTouching = (l, e, s, r) =>
    List.concat([l, [{start: e.start, end_: s.end_}], r]);
  let rec fuseSome = (s1, r1, s2, r2) => {
    let r1' = List_.dropWhile(x => x.end_.pos <= s2.end_.pos, r1);
    helpFuse(r1', [fuseIntervals(s1, s2), ...r2]);
  }
  and outputLeftPrefix = (s1, r1, s2, is2) => {
    let (r1', r1'') = List_.span(s => s.end_.pos < s2.start.pos, r1);
    List.concat([[s1], r1', helpFuse(r1'', is2)]);
  }
  and helpFuse = (a, b) =>
    switch (a, List.rev(a), b, List.rev(b)) {
    | ([], _, _, _) => a
    | (_, _, [], _) => b
    | ([s1, ...r1], [e1, ...l1], [s2, ...r2], [e2, ...l2]) =>
      if (e1.end_.pos < s2.start.pos) {
        List.append(a, b);
      } else if (e2.end_.pos < s1.start.pos) {
        List.append(b, a);
      } else if (e1.end_.pos === s2.start.pos) {
        mergeTouching(l1, e1, s2, r2);
      } else if (e2.end_.pos === s1.start.pos) {
        mergeTouching(l2, e2, s1, r1);
      } else if (s1.end_.pos < s2.start.pos) {
        outputLeftPrefix(s1, r1, s2, b);
      } else if (s2.end_.pos < s1.start.pos) {
        outputLeftPrefix(s2, r2, s1, a);
      } else if (s1.end_.pos < s2.end_.pos) {
        fuseSome(s1, r1, s2, r2);
      } else {
        fuseSome(s2, r2, s1, r1);
      }
    | _ => failwith("something wrong with Range::fuse")
    };
  switch (a, b) {
  | (NoRange, r2) => r2
  | (r1, NoRange) => r1
  | (Range(f, r1), Range(_, r2)) => Range(f, helpFuse(r1, r2))
  };
};

let make = (~range, ~abbr=false, _children) => {
  ...component,
  render: _self =>
    if (abbr) {
      <Link jump=true range>
        <span className="text-subtle range icon icon-link" />
      </Link>;
    } else {
      <Link jump=true range>
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
      createPoint(start.line - 1, start.col - 1),
      createPoint(end_.line - 1, end_.col - 1),
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
type jsProps = {range: Type.Syntax.Position.range};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~range=rangeGet(jsProps), [||])
  );
