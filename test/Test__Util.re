open Rebase;
open Atom;

[@bs.get] external not: BsChai.Expect.chai => BsChai.Expect.chai = "not";

let base = Node.Path.join2([%raw "__dirname"], "../../../");
let file = path => Node.Path.join2(base, path);
let asset = path =>
  Node.Path.join2(Node.Path.join2(base, "test/asset"), path);

let openFile = (uri: string): Js.Promise.t(TextEditor.t) =>
  Environment.Workspace.openWithOnlyURI(uri);

let closeFile = (uri: string): Js.Promise.t(bool) => {
  let pane = Environment.Workspace.paneForURI(uri);
  switch (pane) {
  | None => Js.Promise.resolve(false)
  | Some(p) =>
    let item = Pane.itemForURI(uri, p);
    switch (item) {
    | None => Js.Promise.resolve(false)
    | Some(i) => Pane.destroyItem_(i, true, p)
    };
  };
};

let getActivePackageNames = () =>
  Packages.getActivePackages() |> Array.map(o => o |> Package.name);

let getLoadedPackageNames = () =>
  Packages.getLoadedPackages()
  |> Array.map((o: Package.t) => o |> Package.name);

exception DispatchFailure(string);
let dispatch = (editor: TextEditor.t, event) => {
  let element = Views.getView(editor);
  let result = Commands.dispatch(element, event);
  switch (result) {
  | None => Js.Promise.reject(DispatchFailure(event))
  | Some(_) => Js.Promise.resolve()
  };
};

// bindings for jsdiff
type diff = {
  .
  "value": string,
  "added": bool,
  "removed": bool,
};

[@bs.module "diff"]
external diffLines: (string, string) => array(diff) = "diffLines";

[@bs.module "diff"]
external diffWordsWithSpace: (string, string) => array(diff) =
  "diffWordsWithSpace";

let singleRegressionTest = (fileName, ()) => {
  // get the expected parsed output
  let read = Node.Fs.readFileAsUtf8Sync;
  let input = read("test/TestInputs/" ++ fileName ++ ".in");
  let expectedOutput: string = read("test/TestInputs/" ++ fileName ++ ".out");
  open Parser.Incr.Event;

  // get the actual parsed output
  let toResponse =
    Parser.Incr.Event.map(Rebase.Result.flatMap(Response.parse));

  let actualOutput = ref("");
  let onResponse =
    fun
    | OnResult(Rebase.Error(_)) => BsMocha.Assert.fail("Parsing failed")
    | OnResult(Rebase.Ok(a)) =>
      actualOutput := actualOutput^ ++ Response.toString(a) ++ "\n"
    | OnFinish => ();

  let parser = Parser.SExpression.makeIncr(x => x |> toResponse |> onResponse);

  Connection.parseAgdaOutput(parser, input);

  // compare the expected with the actual
  diffLines(expectedOutput, actualOutput^)
  |> Array.filter(diff => diff##added || diff##removed)
  |> Array.forEach(diff => {
       if (diff##added) {
         BsMocha.Assert.fail("Unexpected string added: " ++ diff##value);
       };
       if (diff##removed) {
         BsMocha.Assert.fail("Unexpected string missing: " ++ diff##value);
       };
     });
  Js.Promise.resolve();
};
