open Rebase;
open Fn;
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

module Golden = {
  exception FileMissing(string);

  type filepath = string;
  type actual = string;
  type t('expected) =
    | Golden(filepath, 'expected, actual);

  // (A -> B) -> Golden A -> Golden B
  let map = (f, Golden(filepath, expected, actual)) => {
    Golden(filepath, f(expected), actual);
  };

  // FilePath -> Promise (Golden String)
  let readFile = filepath => {
    open Js.Promise;
    let readFile = N.Fs.readFile |> N.Util.promisify;

    [|readFile(. filepath ++ ".in"), readFile(. filepath ++ ".out")|]
    |> all
    |> then_(
         fun
         | [|input, output|] =>
           resolve(
             Golden(
               filepath,
               Node.Buffer.toString(input),
               Node.Buffer.toString(output),
             ),
           )
         | _ => reject(FileMissing(filepath)),
       );
  };

  // Golden String -> Promise ()
  let compare = (Golden(path, actual, expected)) => {
    // for keeping the count of charactors before the first error occured
    let erred = ref(false);
    let count = ref(0);
    diffWordsWithSpace(expected, actual)
    |> Array.filter(diff =>
         if (diff##added || diff##removed) {
           // erred!
           if (! erred^) {
             erred := true;
           };
           true;
         } else {
           if (! erred^) {
             count := count^ + String.length(diff##value);
           };
           false;
         }
       )
    |> Array.forEach(diff => {
         let change =
           String.length(diff##value) > 100
             ? String.sub(~from=0, ~length=100, diff##value) ++ " ..."
             : diff##value;

         let expected' =
           String.sub(
             ~from=count^ - 50,
             ~length=50 + String.length(diff##value) + 50,
             expected,
           );

         let actual' =
           String.sub(
             ~from=count^ - 50,
             ~length=50 + String.length(diff##value) + 50,
             actual,
           );

         let message =
           "\n\nexpected => "
           ++ expected'
           ++ "\n\nactual   => "
           ++ actual'
           ++ "\n\nchange => ";
         // let after = "[after]: " ++ lastNormalPiece^ ++ "";

         if (diff##added) {
           BsMocha.Assert.fail(
             message
             ++ " added "
             ++ change
             ++ "\n at position "
             ++ string_of_int(count^),
           );
         };
         if (diff##removed) {
           BsMocha.Assert.fail(
             message
             ++ " removed "
             ++ change
             ++ "\n\n at position "
             ++ string_of_int(count^),
           );
         };
       });
    Js.Promise.resolve();
  };
};

// join with newlines
let serialize = List.fromArray >> String.joinWith("\n") >> (x => x ++ "\n");

let serializeWith = f =>
  Array.map(f) >> List.fromArray >> String.joinWith("\n") >> (x => x ++ "\n");
