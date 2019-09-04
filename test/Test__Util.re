open Rebase;
open Fn;
open Atom;

open Js.Promise;

exception Exn(string);

[@bs.get] external not: BsChai.Expect.chai => BsChai.Expect.chai = "not";

external asElement:
  Webapi.Dom.HtmlElement.t_htmlElement => Webapi.Dom.Element.t =
  "%identity";

exception DispatchFailure(string);
let dispatch' = (event, editor: TextEditor.t): Js.Promise.t(TextEditor.t) => {
  let element = Views.getView(editor);
  let result = Commands.dispatch(element, event);
  switch (result) {
  | None => Js.Promise.reject(DispatchFailure(event))
  | Some(_) => Js.Promise.resolve(editor)
  };
};
let dispatch = (editor: TextEditor.t, event) => {
  let element = Views.getView(editor);
  let result = Commands.dispatch(element, event);
  switch (result) {
  | None => Js.Promise.reject(DispatchFailure(event))
  | Some(_) => Js.Promise.resolve()
  };
};
let dispatchAt = (element: Dom.htmlElement, event) => {
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
             ~from=max(0, count^ - 50),
             ~length=50 + String.length(diff##value) + 50,
             expected,
           );

         let actual' =
           String.sub(
             ~from=max(0, count^ - 50),
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

let breakInput = (breakpoints: array(int), input: string) => {
  let breakpoints' = Array.concat(breakpoints, [|0|]);

  breakpoints'
  |> Array.mapi((x: int, i) =>
       switch (breakpoints'[i + 1]) {
       | Some(next) => (x, next - x)
       | None => (x, String.length(input) - x)
       }
     )
  |> Array.map(((from, length)) => String.sub(~from, ~length, input));
};

module View = {
  open Webapi.Dom;
  open Js.Promise;
  let queryMochaContent = () =>
    document
    |> Document.documentElement
    |> Element.querySelector("#mocha-content");

  let createMochaContent = () => {
    // create `mochaElement`
    let mochaElement = document |> Document.createElement("div");
    Element.setId(mochaElement, "mocha-content");
    // attach `mochaElement` to DOM
    document
    |> Document.asHtmlDocument
    |> Option.flatMap(HtmlDocument.body)
    |> Option.forEach(body =>
         mochaElement
         |> Element.asHtmlElement
         |> Option.forEach(el => Element.appendChild(el, body))
       );

    resolve();
  };

  // attach the given element to #mocha-content
  let attachToDOM = (htmlElement: HtmlElement.t_htmlElement) => {
    let mochaElement = queryMochaContent();

    let alreadyAttached =
      mochaElement
      |> Option.map(Element.contains(htmlElement))
      |> Option.getOr(true);
    ();

    // attach the `htmlElement` to `mochaElement`
    if (!alreadyAttached) {
      mochaElement
      |> Option.forEach(element => Element.appendChild(htmlElement, element));
    };

    resolve();
  };
};

module Path = {
  open Node.Path;

  let base = join2([%raw "__dirname"], "../../../");
  let file = path => join2(base, path);
  let asset = path => join2(join2(base, "test/asset"), path);
};

module File = {
  let open_ = (uri: string): Js.Promise.t(TextEditor.t) =>
    Workspace.openWithURI(uri);

  let close = (uri: string): Js.Promise.t(bool) => {
    let pane = Workspace.paneForURI(uri);
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
};

module Package = {
  let activeNames = () =>
    Packages.getActivePackages() |> Array.map(Package.name);

  let loadedNames = () =>
    Packages.getLoadedPackages() |> Array.map(Package.name);

  let activate = () => {
    // don't wait for this
    Atom.Packages.activatePackage("agda-mode") |> ignore;
    // resolve anyway
    resolve();
  };

  let deactivate = () => {
    Atom.Packages.deactivatePackage("agda-mode", false);
  };
};
