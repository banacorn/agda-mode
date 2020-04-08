open Belt;
open BsMocha.Mocha;
open Js.Promise;
open Test__Util;

describe("when parsing file paths", () =>
  it("should recognize the file extensions", () => {
    open SourceFile.FileType;
    Assert.equal(parse("a.agda"), Agda);
    Assert.equal(parse("a.lagda"), LiterateTeX);
    Assert.equal(parse("a.lagda.tex"), LiterateTeX);
    Assert.equal(parse("a.lagda.md"), LiterateMarkdown);
    Assert.equal(parse("a.lagda.rst"), LiterateRST);
    Assert.equal(parse("a.lagda.org"), LiterateOrg);
  })
);

describe("when parsing source files", () =>
  Golden.getGoldenFilepathsSync("test/Parser/SourceFile")
  ->Array.forEach(filepath =>
      BsMocha.Promise.it("should golden test " ++ filepath, () =>
        Golden.readFile(filepath)
        |> then_(raw =>
             raw
             ->Golden.map(
                 SourceFile.parse(
                   [|0, 1, 2, 3, 4, 5, 6, 7, 8, 9|],
                   filepath,
                 ),
               )
             ->Golden.map(serializeWith(SourceFile.Diff.toString))
             ->Golden.compare
           )
      )
    )
);