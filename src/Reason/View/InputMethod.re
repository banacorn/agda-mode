open ReasonReact;

let sort = Array.sort;

open Rebase;

open Webapi.Dom;

[@bs.module "./../../asset/keymap"]
external rawKeymap : Js.t({.}) = "default";

type trie = {
  symbol: array(string),
  subTrie: Js.Dict.t(trie),
};

let rec toTrie = (obj: Js.t({.})) : trie => {
  let symbol = [%raw {|
  obj[">>"]
|}];
  let subTrie =
    obj
    |> Js.Obj.keys
    |> Array.filter(key => key != ">>")
    |> Array.map(key => (key, toTrie([%raw {|
    obj[key]
  |}])))
    |> Js.Dict.fromArray;
  {symbol, subTrie};
};

let keymap = toTrie(rawKeymap);

let toKeySuggestions = (trie: trie) : array(string) =>
  Js.Dict.keys(trie.subTrie);

let toCandidateSymbols = (trie: trie) : array(string) => trie.symbol;

/* see if the input is in the keymap */
let isInKeymap = (input: string) : option(trie) => {
  let rec helper = (input: string, trie: trie) : option(trie) =>
    switch (String.length(input)) {
    | 0 => Some(trie)
    | n =>
      let key = String.sub(~from=0, ~length=1, input);
      let rest = String.sub(~from=1, ~length=n - 1, input);
      switch (Js.Dict.get(trie.subTrie, key)) {
      | Some(trie') => helper(rest, trie')
      | None => None
      };
    };
  helper(input, keymap);
};

type translation = {
  symbol: option(string),
  further: bool,
  keySuggestions: array(string),
  candidateSymbols: array(string),
};

/* converts characters to symbol, and tells if there's any further possible combinations */
let translate = (input: string) : translation =>
  switch (isInKeymap(input)) {
  | Some(trie) =>
    let keySuggestions = toKeySuggestions(trie);
    let candidateSymbols = toCandidateSymbols(trie);
    {
      symbol: candidateSymbols[0],
      further: Array.length(keySuggestions) != 0,
      keySuggestions,
      candidateSymbols,
    };
  | None =>
    /* key combination out of keymap
       replace with closest the symbol possible */
    {
      symbol: None,
      further: false,
      keySuggestions: [||],
      candidateSymbols: [||],
    }
  };

module Garbages = Atom.CompositeDisposable;

open Atom.Environment;

let mute = ref(false);

let muteEvent = callback => {
  mute := true;
  Js.log("mute!!");
  callback();
  mute := false;
  Js.log("unmute");
};

type state = {
  editors: Editors.t,
  activated: bool,
  /* view related */
  decorations: array(Atom.Decoration.t),
  markers: array(Atom.DisplayMarker.t),
  markersDisposable: option(Atom.Disposable.t),
  /* translation */
  translation,
};

let initialState = (editors, _) => {
  editors,
  activated: false,
  /* view related */
  decorations: [||],
  markers: [||],
  markersDisposable: None,
  /* translation */
  translation: {
    symbol: None,
    further: false,
    keySuggestions: [||],
    candidateSymbols: [||],
  },
};

type action =
  | Activate
  | Deactivate
  | MarkerDidChange(Atom.DisplayMarker.onDidChangeEvent)
  | UpdateDecorations(
      array(Atom.DisplayMarker.t),
      array(Atom.Decoration.t),
      option(Atom.Disposable.t),
    )
  | RemoveDecorations
  | UpdateTranslation(translation)
  /* inserts 1 character to the text buffer (may trigger some events) */
  | InsertCharToBuffer(string);

let reducer = (action, state) =>
  switch (action) {
  | Activate =>
    UpdateWithSideEffects(
      {...state, activated: true},
      (
        _self =>
          if (state.activated) {
            Js.log("already activated");
          } else {
            Js.log("activating!");
            let editor = Editors.getFocusedEditor(state.editors);
            /* add class 'agda-mode-input-method-activated' */
            Views.getView(editor)
            |> HtmlElement.classList
            |> DomTokenListRe.add("agda-mode-input-method-activated");
            /* monitors raw text buffer and figures out what happend */
            let markers: array(Atom.DisplayMarker.t) =
              editor
              |> Atom.TextEditor.getSelectedBufferRanges
              |> Array.map(range =>
                   editor
                   |> Atom.TextEditor.markBufferRange(Atom.Range.copy(range))
                 );
            /* monitors only the first marker */
            let markersDisposable =
              switch (markers[0]) {
              | Some(marker) =>
                marker
                |> Atom.DisplayMarker.onDidChange(event => {
                     Js.log("sending");
                     Js.log(mute);
                     _self.send(MarkerDidChange(event));
                   })
                |> Option.some
              | None => None
              };
            /* decorate the editor with these markers */
            let decorations =
              markers
              |> Array.map(marker =>
                   editor
                   |> Atom.TextEditor.decorateMarker(
                        marker,
                        {
                          "type": `highlight,
                          "class": "input-method-decoration",
                        },
                      )
                 );
            _self.send(
              UpdateDecorations(markers, decorations, markersDisposable),
            );
            /* insert '\' at the cursor quitely without triggering any shit */
            muteEvent(() => _self.send(InsertCharToBuffer("\\")));
          }
      ),
    )
  | Deactivate => Update({...state, activated: false})
  | UpdateDecorations(markers, decorations, markersDisposable) =>
    Update({...state, markers, decorations, markersDisposable})
  | RemoveDecorations => SideEffects((_self => Js.log("disposing bodies")))
  | UpdateTranslation(translation) => Update({...state, translation})
  | MarkerDidChange(event) =>
    SideEffects(
      (
        self => {
          Js.log("MarkerDidChange!");
          Js.log(mute^);
          if (! mute^) {
            open Atom.TextBuffer;
            let rangeOld =
              Atom.Range.make(
                event##oldTailBufferPosition,
                event##oldHeadBufferPosition,
              );
            let rangeNew =
              Atom.Range.make(
                event##newTailBufferPosition,
                event##newHeadBufferPosition,
              );
            let textBuffer =
              Editors.getFocusedEditor(state.editors)
              |> Atom.TextEditor.getBuffer;
            let text = textBuffer |> Atom.TextBuffer.getTextInRange(rangeNew);
            let lengthOld =
              characterIndexForPosition(
                Atom.Range.end_(rangeOld),
                textBuffer,
              )
              - characterIndexForPosition(
                  Atom.Range.start(rangeOld),
                  textBuffer,
                );
            let lengthNew =
              characterIndexForPosition(
                Atom.Range.end_(rangeNew),
                textBuffer,
              )
              - characterIndexForPosition(
                  Atom.Range.start(rangeNew),
                  textBuffer,
                );
            if (rangeNew |> Atom.Range.isEmpty) {
              self.send(Deactivate);
            } else {
              /* insert! */
              if (lengthNew > lengthOld) {
                let translation = translate(text);
                self.send(UpdateTranslation(translation));
                /* reflects current translation to the text buffer */
                switch (translation.symbol) {
                | Some(s) =>
                  muteEvent(() => {
                    /* replace content of the marker with supplied string (may trigger some events) */
                    let textBuffer =
                      Editors.getFocusedEditor(state.editors)
                      |> Atom.TextEditor.getBuffer;
                    self.state.markers
                    |> Array.forEach(marker => {
                         let range =
                           Atom.DisplayMarker.getBufferRange(marker);
                         textBuffer
                         |> Atom.TextBuffer.setTextInRange(range, s)
                         |> ignore;
                       });
                  })
                | None => ()
                };
              };
              /* delete! */
              if (lengthOld > lengthNew) {
                let translation = translate(text);
                self.send(UpdateTranslation(translation));
              };
            };
          };
        }
      ),
    )
  | InsertCharToBuffer(char) =>
    SideEffects(
      (
        _self => {
          Js.log("inserting " ++ char);
          let editor = Editors.getFocusedEditor(state.editors);
          let textBuffer = editor |> Atom.TextEditor.getBuffer;
          /* get all selections and sort them */
          /* the last selection will be placed in the front */
          let getCharIndex = selection => {
            let start =
              Atom.Selection.getBufferRange(selection) |> Atom.Range.start;
            textBuffer |> Atom.TextBuffer.characterIndexForPosition(start);
          };
          let compareSelection = (a: Atom.Selection.t, b: Atom.Selection.t) => {
            let indexA = getCharIndex(a);
            let indexB = getCharIndex(b);
            compare(indexA, indexB);
          };
          let selections = Atom.TextEditor.getSelections(editor);
          sort(compareSelection, selections);
          selections
          |> Array.forEach(selection => {
               let range = Atom.Selection.getBufferRange(selection);
               /* remove selected text */
               textBuffer |> Atom.TextBuffer.delete(range) |> ignore;
               /* insert the desired character */
               textBuffer
               |> Atom.TextBuffer.insert(Atom.Range.start(range), char)
               |> ignore;
               /* in case that '\' is being inserted and happens to be selected,
                  clear the selection and move the cursor at the end */
               if (textBuffer |> Atom.TextBuffer.getTextInRange(range) == "\\") {
                 selection |> Atom.Selection.clear;
                 editor
                 |> Atom.TextEditor.addCursorAtBufferPosition(
                      Atom.Range.end_(range),
                    )
                 |> ignore;
               };
             });
        }
      ),
    )
  };

let component = reducerComponent("InputMethod");

let make =
    (
      ~editors: Editors.t,
      ~interceptAndInsertKey: (string => unit) => unit,
      ~activate: (unit => unit) => unit,
      _children,
    ) => {
  ...component,
  initialState: initialState(editors),
  reducer,
  didMount: self => {
    /* binding for the JS */
    interceptAndInsertKey(char => self.send(InsertCharToBuffer(char)));
    activate(() => self.send(Activate));
    /* listening some events */
    let garbages = Garbages.make();
    /* intercept newline `\n` as confirm */
    Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "editor:newline",
      event =>
      if (self.state.activated) {
        self.send(Deactivate);
        event |> Event.stopImmediatePropagation;
      }
    )
    /* self.handle(
         ((), self') =>
           if (self'.state.activated) {
             self'.send(Deactivate);
             event |> Event.stopImmediatePropagation;
           },
         (),
       ) */
    |> Garbages.add(garbages);
    self.onUnmount(() => garbages |> Garbages.dispose);
  },
  render: _self => null,
};
