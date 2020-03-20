open Belt;
open Atom;

open Js.Promise;

exception Exn(string);

module Assert = {
  let equal = (~message=?, expected, actual) =>
    BsMocha.Assert.equal(~message?, actual, expected);
  let yes = equal(true);
  let no = equal(false);
  let fail = BsMocha.Assert.fail;
  let ok = _ => BsMocha.Assert.ok(true);
  // let not_equal = (~message=?, expected, actual) =>
  //   Assert.not_equal(~message?, actual, expected);
};

module Golden = {
  // bindings for jsdiff
  module Diff = {
    type t =
      | Added(string)
      | Removed(string)
      | NoChange(string);

    let getValue =
      fun
      | Added(string) => string
      | Removed(string) => string
      | NoChange(string) => string;

    type changeObject = {
      .
      "value": string,
      "added": bool,
      "removed": bool,
    };

    // [@bs.module "diff"]
    // external lines: (string, string) => array(t) = "diffLines";

    [@bs.module "diff"]
    external wordsWithSpace_: (string, string) => array(changeObject) =
      "diffWordsWithSpace";

    let fromChangeObject = obj =>
      if (obj##added) {
        Added(obj##value);
      } else if (obj##removed) {
        Removed(obj##value);
      } else {
        NoChange(obj##value);
      };

    let wordsWithSpace = (a, b) => {
      wordsWithSpace_(a, b)->Array.map(fromChangeObject);
    };

    // given a list of Diff.t, return the first Added or Removed and the character count before it
    let firstChange = diffs => {
      // the count of charactors before the first change occured
      let count = ref(0);
      let change = ref(None);
      diffs->Array.forEach(diff =>
        if (Option.isNone(change^)) {
          switch (diff) {
          | Added(s) => change := Some(Added(s))
          | Removed(s) => change := Some(Removed(s))
          | NoChange(s) => count := count^ + String.length(s)
          };
        }
      );

      (change^)->Option.map(change => (change, count^));
    };
  };
  // get all filepaths of golden tests (asynchronously)
  let getGoldenFilepaths = dirname => {
    let readdir = N.Fs.readdir |> N.Util.promisify;
    let isInFile = Js.String.endsWith(".in");
    let toBasename = path =>
      Node.Path.join2(dirname, Node.Path.basename_ext(path, ".in"));
    readdir(. dirname)
    |> then_(paths =>
         paths->Array.keep(isInFile)->Array.map(toBasename)->resolve
       );
  };

  // get all filepaths of golden tests (synchronously)
  let getGoldenFilepathsSync = dirname => {
    let readdir = Node.Fs.readdirSync;
    let isInFile = Js.String.endsWith(".in");
    let toBasename = path =>
      Node.Path.join2(dirname, Node.Path.basename_ext(path, ".in"));
    readdir(dirname)->Array.keep(isInFile)->Array.map(toBasename);
  };

  exception FileMissing(string);

  type filepath = string;
  type actual = string;
  type t('expected) =
    | Golden(filepath, 'expected, actual);

  // (A -> B) -> Golden A -> Golden B
  let map = (Golden(filepath, expected, actual), f) => {
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
    let actual = Js.String.trim(actual);
    let expected = Js.String.trim(expected);
    Diff.wordsWithSpace(actual, expected)
    ->Diff.firstChange
    ->Option.forEach(((diff, count)) => {
        open Diff;
        let value = Diff.getValue(diff);

        let change =
          Js.String.length(value) > 100
            ? Js.String.substrAtMost(~from=0, ~length=100, value) ++ " ..."
            : value;

        let expected' =
          Js.String.substrAtMost(
            ~from=max(0, count - 50),
            ~length=50 + String.length(value) + 50,
            expected,
          );

        let actual' =
          Js.String.substrAtMost(
            ~from=max(0, count - 50),
            ~length=50 + String.length(value) + 50,
            actual,
          );

        let message =
          "\n\nexpected => "
          ++ expected'
          ++ "\n\nactual   => "
          ++ actual'
          ++ "\n\nchange => ";

        switch (diff) {
        | Added(_) =>
          BsMocha.Assert.fail(
            message
            ++ " added \""
            ++ change
            ++ "\"\n at position "
            ++ string_of_int(count),
          )
        | Removed(_) =>
          BsMocha.Assert.fail(
            message
            ++ " removed \""
            ++ change
            ++ "\"\n\n at position "
            ++ string_of_int(count),
          )
        | NoChange(_) => ()
        };
      });
    Js.Promise.resolve();
  };
};

// join with newlines

let serialize = xs => xs->Array.map(x => x ++ "\n")->Js.String.concatMany("");

let serializeWith = (f, xs) => xs->Array.map(f)->serialize;
let breakInput = (input: string, breakpoints: array(int)) => {
  let breakpoints' = Array.concat([|0|], breakpoints);

  breakpoints'
  ->Array.mapWithIndex((i, x: int) =>
      switch (breakpoints'[i + 1]) {
      | Some(next) => (x, next - x)
      | None => (x, Js.String.length(input) - x)
      }
    )
  ->Array.map(((from, length)) =>
      Js.String.substrAtMost(~from, ~length, input)
    );
};

module View = {
  open Webapi.Dom;

  external asElement: HtmlElement.t_htmlElement => Element.t = "%identity";

  let childHtmlElements: HtmlElement.t => array(HtmlElement.t) =
    elem =>
      elem
      ->HtmlElement.childNodes
      ->NodeList.toArray
      ->Array.keepMap(HtmlElement.ofNode);

  // exception PanelContainerNotFound;

  // get all panel containers at bottom
  let getPanelContainersAtBottom = () => {
    Workspace.getBottomPanels()
    ->Array.map(Views.getView)
    ->Array.map(childHtmlElements)
    ->Array.concatMany
    ->Array.keep(elem =>
        HtmlElement.className(elem) == "agda-mode-panel-container"
      );
  };

  // get all panel containers in all panes
  let getPanelContainersAtPanes = (): array(HtmlElement.t) => {
    Workspace.getPaneItems()
    ->Array.map(Views.getView)
    ->Array.keep(elem =>
        HtmlElement.className(elem) == "agda-mode-panel-container"
      );
  };

  // get all panel containers
  let getPanelContainers = (): array(HtmlElement.t) =>
    Array.concat(getPanelContainersAtBottom(), getPanelContainersAtPanes());

  // get the <Panel> of a given Instance
  exception PanelNotFound;
  let getPanel = (instance: Instance.t) => {
    let isTarget = element =>
      HtmlElement.id(element) == "agda-mode:" ++ Instance.getID(instance);

    let panels =
      getPanelContainers()
      ->Array.map(x => x->childHtmlElements->Array.keep(isTarget))
      ->Array.concatMany;

    switch (panels[0]) {
    | None => reject(PanelNotFound)
    | Some(panel) => resolve(panel)
    };
  };

  exception ElementNotFound(string);
  let querySelector =
      (selector: string, elem: HtmlElement.t): Js.Promise.t(HtmlElement.t) => {
    elem
    ->asElement
    ->Element.querySelector(selector, _)
    ->Option.flatMap(Element.asHtmlElement)
    ->Option.mapWithDefault(
        reject(ElementNotFound("cannot find `" ++ selector ++ "`")),
        resolve,
      );
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
  let openAsset = x => x->Path.asset->open_;

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
    Packages.getActivePackages()->Array.map(Package.name);

  let loadedNames = () =>
    Packages.getLoadedPackages()->Array.map(Package.name);

  let activate = () => {
    // don't wait for this
    Packages.activatePackage("agda-mode") |> ignore;
    // manually invoking AgdaMode.activate, because it doesn't get invoked somehow
    AgdaMode.activate();
  };

  let deactivate = () => {
    Packages.deactivatePackage("agda-mode", false);
  };

  // after_each
  let after_each = () => {
    let resetConfig = () => {
      Atom.Config.set("agda-mode.agdaPath", "") |> ignore;
      Atom.Config.set("agda-mode.agdaName", "agda") |> ignore;
      resolve();
    };
    let clearAllFiles = () => {
      File.openAsset("Temp.agda")
      |> then_(editor => {
           let rec cleanUp = () => {
             TextEditor.setText("", editor);
             if (TextEditor.getText(editor) != "") {
               cleanUp();
             } else {
               TextEditor.save(editor);
             };
           };
           cleanUp();
         });
    };
    let destroyAllTextEditors = () =>
      Workspace.getPanes()
      ->Array.map(pane =>
          pane
          ->Pane.getItems
          ->Array.map(item => Pane.destroyItem_(item, true, pane))
        )
      ->Array.concatMany
      ->all
      ->then_(_ => resolve(), _);

    resetConfig() |> then_(destroyAllTextEditors) |> then_(clearAllFiles);
  };
};

let getInstance = editor => {
  AgdaMode.Instances.get(editor)
  ->Option.map((instance: Instance.t) => resolve(instance))
  ->Option.getWithDefault(reject(Exn("instance doesn't exist")));
};

exception DispatchFailure(string);
let dispatch = (event, instance: Instance.t): Js.Promise.t(Instance.t) => {
  // resolves on command dispatch
  let onDispatch =
    instance.Instance__Type.onDispatch.once()->Promise.Js.toBsPromise;
  // dispatch command using Atom's API
  switch (Commands.dispatch(Views.getView(instance.editors.source), event)) {
  | None => reject(DispatchFailure(event))
  | Some(result) =>
    result |> then_(() => onDispatch) |> then_(() => resolve(instance))
  // |> then_(_ =>
  //      Js.Promise.make((~resolve, ~reject as _) =>
  //        Js.Global.setTimeout(() => resolve(. instance), 0) |> ignore
  //      )
  //    )
  // |> then_(instance =>
  //      Js.Promise.make((~resolve, ~reject as _) =>
  //        Js.Global.setTimeout(() => resolve(. instance), 0) |> ignore
  //      )
  //    )
  };
};

let openAndLoad = (path): Js.Promise.t(Instance.t) => {
  File.openAsset(path)
  |> then_(getInstance)
  |> then_(dispatch("agda-mode:load"));
};

let close = (instance: Instance.t): Js.Promise.t(unit) => {
  let onDestroy = instance.view.onDestroy.once()->Promise.Js.toBsPromise;

  instance.editors.source
  |> TextEditor.asWorkspaceItem
  |> Workspace.hideItem
  |> ignore;

  onDestroy;
};

module Keyboard = {
  // building and triggering the event

  let dispatch = (key, instance: Instance.t): Js.Promise.t(Instance.t) => {
    open Instance__Type;
    let element = instance.editors.source |> Views.getView;
    // resolves on command dispatch
    let onDispatch =
      instance.Instance__Type.onDispatch.once()->Promise.Js.toBsPromise;

    // build and dispatch the keyboard event
    let keyboardEvent =
      Keymaps.buildKeydownEvent_(
        key,
        {
          "ctrl": false,
          "alt": false,
          "shift": false,
          "cmd": false,
          "which": 0,
          "target": element,
        },
      );
    Keymaps.handleKeyboardEvent(keyboardEvent);

    onDispatch
    |> then_(() =>
         Js.Promise.make((~resolve, ~reject as _) =>
           Js.Global.setTimeout(() => resolve(. instance), 0) |> ignore
         )
       );
  };

  // `TextEditor.insertText` sometimes fails on CI
  // insert again until it works
  let rec insertUntilSuccess = (text, instance: Instance.t) => {
    let editor = instance.editors.source;
    let before = TextEditor.getText(editor);
    // Js.log("[ IM ][ insert listen ] " ++ before);

    TextEditor.insertText(text, editor) |> ignore;

    TextEditor.save(editor)
    |> then_(_ => {
         let after = TextEditor.getText(editor);
         if (before !== after) {
           // succeed
           // Js.log("[ IM ][ insert complete ] " ++ before ++ " => " ++ after);
           resolve(
             instance,
           );
         } else {
           // Js.log("[ IM ][ insert failed ! ] ");
           // failed, try again
           TextEditor.setText(before, editor);
           insertUntilSuccess(text, instance);
         };
       });
  };

  let insert = (key, instance: Instance.t) => {
    // listen
    let onChange =
      instance.view.onInputMethodChange.once()->Promise.Js.toBsPromise;
    // trigger (insert & save)
    insertUntilSuccess(key, instance)
    |> then_(_ => onChange)
    |> then_(_ => resolve(instance));
  };

  let backspace = (instance: Instance.t) => {
    let rec backspaceUntilSuccess = () => {
      let before = TextEditor.getText(instance.editors.source);
      // Js.log("[ IM ][ backspace listen ] " ++ before);

      TextEditor.backspace(instance.editors.source);

      TextEditor.save(instance.editors.source)
      |> then_(_ => {
           let after = TextEditor.getText(instance.editors.source);
           if (before !== after) {
             // succeed
             // Js.log(
             //   "[ IM ][ backspace complete ] " ++ before ++ " => " ++ after,
             // );
             resolve();
           } else {
             // Js.log("[ IM ][ backspace failed ! ] ");
             // failed, try again
             TextEditor.setText(before, instance.editors.source);
             backspaceUntilSuccess();
           };
         });
    };

    // listen
    let onChange =
      instance.view.onInputMethodChange.once()->Promise.Js.toBsPromise;
    // trigger (backspace & save)
    backspaceUntilSuccess()
    |> then_(_ => onChange)
    |> then_(_ => resolve(instance));
  };
};