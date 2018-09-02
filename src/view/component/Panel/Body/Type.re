module Agda = {
  module Syntax = {
    module Position = {
      type srcFile = option(string);
      type position = {
        pos: int,
        line: int,
        col: int,
      };
      type interval = {
        start: position,
        end_: position,
      };
      type range =
        | NoRange
        | Test
        | Range(srcFile, list(interval));
    };
    module Concrete = {
      type nameId = {
        name: string,
        module_: string,
      };
      type namePart =
        | Hole
        | Id(string);
      type name =
        | Name(Position.range, list(namePart))
        | NoName(Position.range, nameId);
      type qName = list(name);
    };
  };
  module TypeChecking = {
    type error =
      | TypeError(Syntax.Position.range)
      | Exception(Syntax.Position.range, string)
      | IOException(Syntax.Position.range, string)
      | PatternError(Syntax.Position.range);
  };
};

type event =
  | JumpToRange
  | MouseOver
  | MouseOut;
