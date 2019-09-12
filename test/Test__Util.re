open Rebase;
open Fn;
open Atom;

open Js.Promise;

exception Exn(string);

module Golden = {
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
  let compare = (Golden(_path, actual, expected)) => {
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

  external asElement: HtmlElement.t_htmlElement => Element.t = "%identity";

  let childHtmlElements: HtmlElement.t => array(HtmlElement.t) =
    HtmlElement.childNodes
    >> NodeList.toArray
    >> Array.filterMap(HtmlElement.ofNode);

  exception PanelContainerNotFound;
  let getPanelContainerAtBottom = () => {
    let containers: array(HtmlElement.t) =
      Atom.Workspace.getBottomPanels()
      |> Array.map(Atom.Views.getView)
      |> Array.flatMap(childHtmlElements)
      |> Array.filter(elem =>
           elem |> HtmlElement.className == "agda-mode-panel-container"
         );

    switch (containers[0]) {
    | None => reject(PanelContainerNotFound)
    | Some(container) => resolve(container)
    };
  };
  //
  // let getPanelContainerAtBottom2 = () => {
  //   let containers: array(HtmlElement.t) =
  //     Atom.Workspace.getBottomPanels()
  //     |> Array.map(Atom.Views.getView)
  //     |> Array.flatMap(childHtmlElements)
  //     |> Array.filter(elem =>
  //          elem |> HtmlElement.className == "agda-mode-panel-container"
  //        );
  //
  //   switch (containers[0]) {
  //   | None => reject(PanelContainerNotFound)
  //   | Some(container) => resolve(container)
  //   };
  // };

  exception PanelNotFound;
  let getPanelAtBottom = (instance: Instance.t) => {
    let targetID = "agda-mode:" ++ Instance.getID(instance);

    getPanelContainerAtBottom()
    |> then_(container => {
         let panels =
           container
           |> childHtmlElements
           |> Array.filter(elem => elem |> HtmlElement.id == targetID);

         switch (panels[0]) {
         | None => reject(PanelNotFound)
         | Some(panel) => resolve(panel)
         };
       });
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
  let openAsset = Path.asset >> open_;

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
    // manually invoking AgdaMode.activate, because it doesn't get invoked somehow
    AgdaMode.activate();
  };

  let deactivate = () => {
    Atom.Packages.deactivatePackage("agda-mode", false);
  };

  let cleanup = () => {
    // destroy all textEditors
    Atom.Workspace.getPanes() |> Array.forEach(Atom.Pane.destroyItems);

    resolve();
  };
};

let getInstance = editor => {
  AgdaMode.Instances.get(editor)
  |> Option.map((instance: Instance.t) => resolve(instance))
  |> Option.getOr(reject(Exn("instance doesn't exist")));
};

exception DispatchFailure(string);
let dispatch = (event, instance: Instance.t): Js.Promise.t(Instance.t) => {
  // resolves on command dispatch
  let onDispatch = instance.Instance__Type.onDispatch |> Event.once;
  // dispatch command using Atom's API
  switch (Commands.dispatch(Views.getView(instance.editors.source), event)) {
  | None => reject(DispatchFailure(event))
  | Some(result) =>
    result |> then_(() => onDispatch) |> then_(_ => resolve(instance))
  };
};

let openAndLoad = (path): Js.Promise.t(Instance.t) => {
  File.openAsset(path)
  |> then_(getInstance)
  |> then_(dispatch("agda-mode:load"));
};

module Keyboard = {
  // building and triggering the event
  let press' = (element, key) =>
    Atom.Keymaps.buildKeydownEvent_(
      key,
      {
        "ctrl": false,
        "alt": false,
        "shift": false,
        "cmd": false,
        "which": 0,
        "target": element,
      },
    )
    |> Atom.Keymaps.handleKeyboardEvent;

  let press = (key, instance: Instance.t): Js.Promise.t(Instance.t) => {
    open Instance__Type;
    let element = instance.editors.source |> Views.getView;
    // resolves on command dispatch
    let onDispatch = instance.onDispatch |> Event.once;

    press'(element, key);

    onDispatch |> Async.toPromise |> then_(() => resolve(instance));
  };
};
