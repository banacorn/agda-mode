open Rebase;
module Position = {
  type t = {
    pos: option(int),
    line: int,
    col: int,
  };

  open Json.Decode;
  let decode =
    array(int)
    |> andThen((tup, _) =>
         {
           pos: tup[2],
           line: tup[0] |> Option.getOr(0),
           col: tup[1] |> Option.getOr(0),
         }
       );
};
module Interval = {
  type t = {
    start: Position.t,
    end_: Position.t,
  };

  let fuse = (a, b) => {
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

  let toString = (self): string =>
    if (self.start.line === self.end_.line) {
      string_of_int(self.start.line)
      ++ ","
      ++ string_of_int(self.start.col)
      ++ "-"
      ++ string_of_int(self.end_.col);
    } else {
      string_of_int(self.start.line)
      ++ ","
      ++ string_of_int(self.start.col)
      ++ "-"
      ++ string_of_int(self.end_.line)
      ++ ","
      ++ string_of_int(self.end_.col);
    };

  let toAtomRange = self => {
    let start = Atom.Point.make(self.start.line - 1, self.start.col - 1);
    let end_ = Atom.Point.make(self.end_.line - 1, self.end_.col - 1);
    Atom.Range.make(start, end_);
  };

  open Json.Decode;

  let decode = json => {
    start: json |> field("start", Position.decode),
    end_: json |> field("end", Position.decode),
  };
};

module Range = {
  type t =
    | NoRange
    | Range(option(string), array(Interval.t));

  type linkTarget =
    | RangeLink(t)
    | HoleLink(int);

  let fuse = (a: t, b: t): t => {
    open Interval;

    let mergeTouching = (l, e, s, r) =>
      List.concat(List.concat(l, [{start: e.start, end_: s.end_}]), r);

    let rec fuseSome = (s1, r1, s2, r2) => {
      let r1' = Util.List_.dropWhile(x => x.end_.pos <= s2.end_.pos, r1);
      helpFuse(r1', [Interval.fuse(s1, s2), ...r2]);
    }
    and outputLeftPrefix = (s1, r1, s2, is2) => {
      let (r1', r1'') = Util.List_.span(s => s.end_.pos < s2.start.pos, r1);
      List.concat(List.concat([s1], r1'), helpFuse(r1'', is2));
    }
    and helpFuse = (a: List.t(Interval.t), b: List.t(Interval.t)) =>
      switch (a, List.reverse(a), b, List.reverse(b)) {
      | ([], _, _, _) => a
      | (_, _, [], _) => b
      | ([s1, ...r1], [e1, ...l1], [s2, ...r2], [e2, ...l2]) =>
        if (e1.end_.pos < s2.start.pos) {
          List.concat(a, b);
        } else if (e2.end_.pos < s1.start.pos) {
          List.concat(b, a);
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
    | (Range(f, r1), Range(_, r2)) =>
      Range(
        f,
        helpFuse(List.fromArray(r1), List.fromArray(r2)) |> Array.fromList,
      )
    };
  };

  let toString = (self: t): string =>
    switch (self) {
    | NoRange => ""
    | Range(None, xs) =>
      switch (xs[0], xs[Array.length(xs) - 1]) {
      | (Some(first), Some(last)) =>
        Interval.toString({start: first.start, end_: last.end_})
      | _ => ""
      }

    | Range(Some(filepath), [||]) => filepath
    | Range(Some(filepath), xs) =>
      filepath
      ++ ":"
      ++ (
        switch (xs[0], xs[Array.length(xs) - 1]) {
        | (Some(first), Some(last)) =>
          Interval.toString({start: first.start, end_: last.end_})
        | _ => ""
        }
      )
    };

  let toAtomRanges = self => {
    switch (self) {
    | NoRange => [||]
    | Range(_, intervals) =>
      intervals |> Rebase.Array.map(Interval.toAtomRange)
    };
  };

  open Json.Decode;

  let decode =
    field("kind", string)
    |> andThen((kind, json) =>
         switch (kind) {
         | "Range" =>
           Range(
             json |> field("source", optional(string)),
             json |> field("intervals", array(Interval.decode)),
           )
         | "NoRange" => NoRange
         | _ => failwith("unknown kind of Range")
         }
       );
};
