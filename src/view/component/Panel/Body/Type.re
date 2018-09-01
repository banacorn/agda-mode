module Agda = {
  module Syntax = {
    module Position = {
      type srcFile = option(string);
      type position = {
        scrFile: srcFile,
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
};

type event =
  | JumpToRange
  | MouseOver
  | MouseOut;
