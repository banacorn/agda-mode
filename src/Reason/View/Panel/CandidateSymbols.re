open ReasonReact;

open Rebase;

open Webapi;

type state = {index: int};

type action =
  | MoveUp
  | MoveDown
  | MoveRight
  | MoveLeft;

let component = reducerComponent("CandidateSymbols");

let make =
    (
      ~candidateSymbols: array(string),
      ~updateTranslation: option(string) => unit,
      ~chooseSymbol: string => unit,
      _children,
    ) => {
  ...component,
  initialState: () => {index: 0},
  reducer: (action, {index}) =>
    switch (action) {
    | MoveUp =>
      let newIndex = max(0, index - 10);
      UpdateWithSideEffects(
        {index: newIndex},
        ((_) => updateTranslation(candidateSymbols[newIndex])),
      );
    | MoveRight =>
      let newIndex = min(Array.length(candidateSymbols) - 1, index + 1);
      UpdateWithSideEffects(
        {index: newIndex},
        ((_) => updateTranslation(candidateSymbols[newIndex])),
      );
    | MoveDown =>
      let newIndex = min(Array.length(candidateSymbols) - 1, index + 10);
      UpdateWithSideEffects(
        {index: newIndex},
        ((_) => updateTranslation(candidateSymbols[newIndex])),
      );
    | MoveLeft =>
      let newIndex = max(0, index - 1);
      UpdateWithSideEffects(
        {index: newIndex},
        ((_) => updateTranslation(candidateSymbols[newIndex])),
      );
    },
  didMount: self => {
    /* subscribe to Atom's core events */
    let disposables = Atom.CompositeDisposable.make();
    Atom.Environment.Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "core:move-up",
      event => {
        self.send(MoveUp);
        event |> Dom.Event.stopImmediatePropagation;
      },
    )
    |> Atom.CompositeDisposable.add(disposables);
    Atom.Environment.Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "core:move-right",
      event => {
        self.send(MoveRight);
        event |> Dom.Event.stopImmediatePropagation;
      },
    )
    |> Atom.CompositeDisposable.add(disposables);
    Atom.Environment.Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "core:move-down",
      event => {
        self.send(MoveDown);
        event |> Dom.Event.stopImmediatePropagation;
      },
    )
    |> Atom.CompositeDisposable.add(disposables);
    Atom.Environment.Commands.add(
      `CSSSelector("atom-text-editor.agda-mode-input-method-activated"),
      "core:move-left",
      event => {
        self.send(MoveLeft);
        event |> Dom.Event.stopImmediatePropagation;
      },
    )
    |> Atom.CompositeDisposable.add(disposables);
    self.onUnmount(() => disposables |> Atom.CompositeDisposable.dispose);
  },
  render: self => {
    let rowStart = self.state.index / 10 * 10;
    let row =
      candidateSymbols |> Array.slice(~from=rowStart, ~to_=rowStart + 10);
    switch (candidateSymbols[self.state.index]) {
    | None => null
    | Some(_) =>
      let keys =
        row
        |> Array.mapi((key, i) => {
             let isSelected = rowStart + i === self.state.index;
             let className =
               ["btn"]
               |> Util.addClass("selected", isSelected)
               |> Util.toClassName;
             <button className onClick=((_) => chooseSymbol(key)) key>
               (string(key))
             </button>;
           });
      <div className="candidates btn-group btn-group-sm"> ...keys </div>;
    };
  },
};

[@bs.deriving abstract]
type jsProps = {
  candidateSymbols: array(string),
  updateTranslation: option(string) => unit,
  chooseSymbol: string => unit,
};

let jsComponent =
  wrapReasonForJs(~component, jsProps =>
    make(
      ~candidateSymbols=candidateSymbolsGet(jsProps),
      ~updateTranslation=updateTranslationGet(jsProps),
      ~chooseSymbol=chooseSymbolGet(jsProps),
      [||],
    )
  );
