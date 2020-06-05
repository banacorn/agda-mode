open! Atom;
open! Belt;

module Impl:
  AgdaModeVscode.Sig.Editor with
    type editor = TextEditor.t and type context = CompositeDisposable.t = {
  type editor = TextEditor.t;
  type context = CompositeDisposable.t;
  module Disposable = {
    type t = Disposable.t;
    let make = Disposable.make;
    let dispose = Disposable.dispose;
  };
  type view = View.t;

  type ordering =
    | GT
    | EQ
    | LT;

  module Point = {
    type t = Point.t;
    let make = Point.make;
    let line = Point.row;
    let column = Point.column;
    let translate = (p, x, y) => Point.translate(Point.make(x, y), p);
    let compare = (x, y) =>
      switch (Atom.Point.compare(x, y)) {
      | (-1) => LT
      | 1 => GT
      | _ => EQ
      };
  };

  module Range = {
    type t = Atom.Range.t;
    let make = Atom.Range.make;
    let start = Atom.Range.start;
    let end_ = Atom.Range.end_;

    let contains = (self, point) => Atom.Range.containsPoint(point, self);
    let containsRange = (self, others) =>
      Atom.Range.containsRange(others, self);
  };

  type fileName = string;

  let editorType = AgdaModeVscode.Sig.Atom;

  let getExtensionPath = _ =>
    Packages.resolvePackagePath("agda-mode")->Option.getWithDefault("");

  let getFileName = editor => TextEditor.getPath(editor);

  let save = editor =>
    editor
    ->TextEditor.save
    ->Promise.Js.fromBsPromise
    ->Promise.Js.toResult
    ->Promise.map(
        fun
        | Error(_) => false
        | Ok(_) => true,
      );

  let addToSubscriptions = (disposable, subscriptions) =>
    disposable |> CompositeDisposable.add(subscriptions);

  // when the editor got closed
  let onDidCloseEditor = callback =>
    Workspace.observeTextEditors(editor => {
      let subscriptions = CompositeDisposable.make();
      editor
      |> TextEditor.onDidDestroy(() => {
           TextEditor.getPath(editor)->Option.forEach(callback);
           CompositeDisposable.dispose(subscriptions);
         })
      |> CompositeDisposable.add(subscriptions);
    });
  // Workspace.onDidChangeActiveTextEditor(next => {});

  let onDidChangeFileName = callback =>
    Workspace.observeTextEditors(editor => {
      let subscriptions = CompositeDisposable.make();
      let previous = ref(TextEditor.getPath(editor));
      editor
      |> TextEditor.onDidChangePath(() => {
           let next = TextEditor.getPath(editor);
           if (next != previous^) {
             callback(previous^, next);
             previous := next;
           };
         })
      |> CompositeDisposable.add(subscriptions);
    });

  let onDidChangeActivation = callback => {
    let previous = ref(Workspace.getActiveTextEditor());
    Workspace.onDidChangeActiveTextEditor(next => {
      let previousFileName = (previous^)->Option.flatMap(TextEditor.getPath);
      let nextFileName = next->Option.flatMap(TextEditor.getPath);
      if (previousFileName != nextFileName) {
        callback(previousFileName, nextFileName);
        previous := next;
      };
    });
  };

  // if end with '.agda' or '.lagda'
  let isAgda = (filepath): bool => {
    let filepath = filepath->AgdaModeVscode.Parser.filepath;
    Js.Re.test_([%re "/\\.agda$|\\.lagda$/i"], filepath);
  };

  let registerCommand = (name, callback) => {
    // find the <TextEditor> targeted by the given event
    let eventTargetEditor = (event: Webapi.Dom.Event.t): option(TextEditor.t) => {
      // the HtmlElement of the event target
      let targetSubElement =
        event
        |> Webapi.Dom.Event.target
        |> Webapi.Dom.EventTarget.unsafeAsElement
        |> Webapi.Dom.Element.unsafeAsHtmlElement;

      // the <TextEditor>s that contain the event target
      let targetedEditors =
        Workspace.getTextEditors()
        ->Array.keep(x =>
            x
            |> Views.getView
            |> Webapi.Dom.HtmlElement.asNode
            |> Webapi.Dom.Node.contains(targetSubElement)
          );

      targetedEditors[0];
    };

    Commands.add(
      `CSSSelector("atom-text-editor"), "agda-mode:" ++ name, event => {
      eventTargetEditor(event)->Option.forEach(callback)
    });
  };

  let setContext = (_, _) => Promise.resolved();

  // let getActiveEditor = () => Window.activeTextEditor;

  module Config = {
    // Agda path
    let setAgdaPath = value => {
      Config.set("agda-mode.path", value) |> ignore;
      Promise.resolved();
    };
    let getAgdaPath = () => Config.get("agda-mode.path");

    // Library path
    let getLibraryPath = () => {
      let raw =
        Config.get("agda-mode.libraryPath")->Option.getWithDefault("");
      // split by comma, and clean them up
      Js.String.split(",", raw)
      ->Array.keep(x => x !== "")
      ->Array.map(AgdaModeVscode.Parser.filepath);
    };

    // Highlighting method
    let getHighlightingMethod = () => {
      let raw = Config.get("agda-mode.highlightingMethod");
      switch (raw) {
      | Some("Direct") => true
      | _ => false
      };
    };
  };

  module View = View;

  module Decoration = {
    type t = Atom.Decoration.t;

    type style = string;

    // rewrite "?" to "{!!}"
    let digHole = (editor, range) => {
      let start = Atom.Range.start(range);
      // add indentation to the hole
      let indent = Js.String.repeat(Atom.Point.column(start), " ");
      let holeText = "{!\n" ++ indent ++ "\n" ++ indent ++ "!}";
      let holeRange =
        Atom.Range.make(
          start,
          Atom.Point.translate(start, Atom.Point.make(0, 1)),
        );
      editor |> TextEditor.setTextInBufferRange(holeRange, holeText) |> ignore;
      // set the cursor inside the hole
      let cursorPos = Atom.Point.translate(start, Atom.Point.make(1, 0));
      editor |> TextEditor.setCursorBufferPosition(cursorPos);
    };

    let highlightBackground = (editor, kind: style, range) => {
      let createMarker = (class_, range) => {
        let marker = TextEditor.markBufferRange(range, editor);
        let option =
          TextEditor.decorateMarkerOptions(~type_="highlight", ~class_, ());
        TextEditor.decorateMarker(marker, option, editor);
      };
      switch (kind) {
      | "Error" => [|createMarker("highlight-error", range)|]
      | "Highlight" => [|createMarker("highlight-link", range)|]
      | _ => [|createMarker("highlight-spec", range)|]
      };
    };
    // let overlayText: (editor, style, string, Range.t) => array(t);
    let overlayText = (editor, kind: style, text: string, range: Range.t) => {
      let createOverlay =
          (text, class_, tail: bool, translation: (int, int), range) => {
        open Webapi.Dom;

        // create an element for the overlay
        let element = document |> Document.createElement("div");
        Element.setInnerHTML(element, text);
        element |> Element.classList |> DomTokenList.add(class_);

        // adjusting the position of the overlay
        // setStyle is not supported by Reason Webapi for the moment, so we use setAttribute instead

        let (y, x) = translation;
        let left = x;
        let top = float_of_int(y - 1) *. 1.5;

        element
        |> Element.setAttribute(
             "style",
             "left: "
             ++ string_of_int(left)
             ++ "ex; top: "
             ++ Js.Float.toString(top)
             ++ "em",
           );

        // decorate
        let marker = editor |> TextEditor.markBufferRange(range);
        let option =
          TextEditor.decorateMarkerOptions(
            ~type_="overlay",
            ~position=tail ? "tail" : "head",
            ~item=Element.unsafeAsHtmlElement(element),
            (),
          );
        TextEditor.decorateMarker(marker, option, editor);
      };

      switch (kind) {
      | "Error" => [|
          createOverlay(text, "overlay-error", true, (0, 0), range),
        |]
      | "Highlight" => [|
          createOverlay(text, "overlay-link", false, (0, 1), range),
        |]
      | _ => [|createOverlay(text, "overlay-spec", false, (0, 1), range)|]
      };
    };

    let destroy = Atom.Decoration.destroy;
  };

  let focus = editor =>
    editor |> Views.getView |> Webapi.Dom.HtmlElement.focus;

  let getCursorPosition = editor =>
    TextEditor.getCursorBufferPosition(editor);
  let setCursorPosition = (editor, point) =>
    TextEditor.setCursorBufferPosition(point, editor);

  let rangeForLine = (editor, line) =>
    editor |> TextEditor.getBuffer |> TextBuffer.rangeForRow(line, true);

  let pointAtOffset = (editor, offset) =>
    TextEditor.getBuffer(editor)
    |> TextBuffer.positionForCharacterIndex(offset);
  let offsetAtPoint = (editor, point) =>
    TextEditor.getBuffer(editor)
    |> TextBuffer.characterIndexForPosition(point);

  let getText = editor => editor |> TextEditor.getBuffer |> TextBuffer.getText;

  let getTextInRange = (editor, range) =>
    TextEditor.getTextInBufferRange(range, editor);

  let selectText = (editor, range) =>
    TextEditor.setSelectedScreenRange(range, editor);

  let setText = (editor, range, text) => {
    TextEditor.setTextInBufferRange(range, text, editor)->ignore;
    Promise.resolved(true);
  };

  let insertText = (editor, point, text) => {
    editor |> TextEditor.getBuffer |> TextBuffer.insert(point, text) |> ignore;
    Promise.resolved(true);
  };

  let deleteText = (editor, range) => {
    editor |> TextEditor.getBuffer |> TextBuffer.delete(range) |> ignore;
    Promise.resolved(true);
  };
};