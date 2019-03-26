let component = ReasonReact.statelessComponent("Range");

open Type.Location;

open Util;

let fuseIntervals = (a, b) => {
  open Type.Location.Interval;

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
  open Type.Location.Interval;

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
  Range.(
    switch (a, b) {
    | (NoRange, r2) => r2
    | (r1, NoRange) => r1
    | (Range(f, r1), Range(_, r2)) => Range(f, helpFuse(r1, r2))
    }
  );
};

module Link = Component__Link;

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
          {ReasonReact.string(Range.toString(range))}
        </span>
      </Link>;
    },
};

[@bs.deriving abstract]
type jsProps = {range: Range.t};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~range=rangeGet(jsProps), [||])
  );
