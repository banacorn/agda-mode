open Belt;
open BsMocha.Mocha;
open Js.Promise;
open Test__Util;

describe_only("when parsing source files", () =>
  Golden.getGoldenFilepathsSync("test/Parser/SourceFile")
  ->Array.forEach(filepath =>
      BsMocha.Promise.it("should golden test " ++ filepath, () =>
        Golden.readFile(filepath)
        |> then_(raw =>
             raw
             ->Golden.map(Hole.parse(_, [|0, 1, 2|], Goal.FileType.parse(filepath)))
             ->Golden.map(serializeWith(Hole.Diff.toString))
             ->Golden.compare
           )
      )
    )
);