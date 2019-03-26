module Position = {
  type t = {
    pos: option(int),
    line: int,
    col: int,
  };
};
module Interval = {
  type t = {
    start: Position.t,
    end_: Position.t,
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
};

module Range = {
  type t =
    | NoRange
    | Range(option(string), list(Interval.t));

  let toString = (self: t): string =>
    switch (self) {
    | NoRange => ""
    | Range(None, []) => ""
    | Range(None, xs) =>
      Interval.toString({
        start: List.hd(xs).start,
        end_: List.nth(xs, List.length(xs) - 1).end_,
      })
    | Range(Some(filepath), []) => filepath
    | Range(Some(filepath), xs) =>
      filepath
      ++ ":"
      ++ Interval.toString({
           start: List.hd(xs).start,
           end_: List.nth(xs, List.length(xs) - 1).end_,
         })
    };

  let toAtomRanges = self => {
    switch (self) {
    | NoRange => [||]
    | Range(_, intervals) =>
      intervals
      |> Rebase.Array.fromList
      |> Rebase.Array.map(Interval.toAtomRange)
    };
  };
};
