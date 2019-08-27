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

// get all filepaths of golden tests (asynchronously)
let getGoldenFilepaths = dirname => {
  open Js.Promise;
  let readdir = N.Fs.readdir |> N.Util.promisify;
  let isInFile = Js.String.endsWith(".in");
  let toBasename = path =>
    Node.Path.join2(dirname, Node.Path.basename_ext(path, ".in"));
  readdir(. dirname)
  |> then_(paths =>
       paths |> Array.filter(isInFile) |> Array.map(toBasename) |> resolve
     );
};

// get all filepaths of golden tests (synchronously)
let getGoldenFilepathsSync = dirname => {
  let readdir = Node.Fs.readdirSync;
  let isInFile = Js.String.endsWith(".in");
  let toBasename = path =>
    Node.Path.join2(dirname, Node.Path.basename_ext(path, ".in"));
  readdir(dirname) |> Array.filter(isInFile) |> Array.map(toBasename);
};

exception GoldenFileMissing(string);
let readGoldenFile = filepath => {
  open Js.Promise;
  let readFile = N.Fs.readFile |> N.Util.promisify;

  [|readFile(. filepath ++ ".in"), readFile(. filepath ++ ".out")|]
  |> all
  |> then_(
       fun
       | [|input, output|] =>
         resolve((
           Node.Buffer.toString(input),
           Node.Buffer.toString(output),
         ))
       | _ => reject(GoldenFileMissing(filepath)),
     );
};

let readGoldenFiles = dirname => {
  open Js.Promise;
  let readFile = N.Fs.readFile |> N.Util.promisify;
  getGoldenFilepaths(dirname)
  |> then_(paths =>
       paths
       |> Array.map(path =>
            [|readFile(. path ++ ".in"), readFile(. path ++ ".out")|]
            |> all
            |> then_(
                 fun
                 | [|input, output|] =>
                   resolve(
                     Some((
                       Node.Buffer.toString(input),
                       Node.Buffer.toString(output),
                     )),
                   )
                 | _ => resolve(None),
               )
          )
       |> all
     )
  |> then_(pairs => pairs |> Array.filterMap(Fn.id) |> resolve);
};

let parseAsResponse = input => {
  open Parser.Incr.Event;

  // get the actual parsed output
  let toResponse =
    Parser.Incr.Event.map(Rebase.Result.flatMap(Response.parse));

  let output = ref("");
  let onResponse =
    fun
    | OnResult(Rebase.Error(_)) => BsMocha.Assert.fail("Parsing failed")
    | OnResult(Rebase.Ok(a)) =>
      output := output^ ++ Response.toString(a) ++ "\n"
    | OnFinish => ();

  let parser = Parser.SExpression.makeIncr(x => x |> toResponse |> onResponse);

  Connection.parseAgdaOutput(parser, input);

  output^;
};

let parseAsResponseAndCompare = ((input, expected)) => {
  let actual = parseAsResponse(input);
  // compare the expected with the actual

  diffLines(expected, actual)
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
