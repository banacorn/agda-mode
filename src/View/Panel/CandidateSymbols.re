open ReasonReact;

open Rebase;

open Webapi;

type state = {
  index: int,
  listener: option(Atom.CompositeDisposable.t),
};

type action =
  | Activate
  | Deactivate
  | UpdateListener(option(Atom.CompositeDisposable.t))
  | MoveUp
  | MoveDown
  | MoveRight
  | MoveLeft;

let component = reducerComponentWithRetainedProps("CandidateSymbols");

let startListening = self => {
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
  // return the handle
  disposables;
};

let stopListening = Atom.CompositeDisposable.dispose;

let make =
    (
      ~isActive: bool,
      ~candidateSymbols: array(string),
      ~updateTranslation: option(string) => unit,
      ~chooseSymbol: string => unit,
      _children,
    ) => {
  ...component,
  retainedProps: isActive,
  initialState: () => {index: 0, listener: None},
  reducer: (action, state) => {
    switch (action) {
    | Activate =>
      SideEffects(
        self => {
          let listener = startListening(self);
          self.send(UpdateListener(Some(listener)));
        },
      )
    | Deactivate =>
      SideEffects(
        self => {
          switch (self.state.listener) {
          | None => ()
          | Some(listener) => stopListening(listener)
          };
          self.send(UpdateListener(None));
        },
      )
    | UpdateListener(listener) => Update({...state, listener})
    | MoveUp =>
      let newIndex = max(0, state.index - 10);
      UpdateWithSideEffects(
        {...state, index: newIndex},
        _ => updateTranslation(candidateSymbols[newIndex]),
      );
    | MoveRight =>
      let newIndex =
        min(Array.length(candidateSymbols) - 1, state.index + 1);
      UpdateWithSideEffects(
        {...state, index: newIndex},
        _ => updateTranslation(candidateSymbols[newIndex]),
      );
    | MoveDown =>
      let newIndex =
        min(Array.length(candidateSymbols) - 1, state.index + 10);
      UpdateWithSideEffects(
        {...state, index: newIndex},
        _ => updateTranslation(candidateSymbols[newIndex]),
      );
    | MoveLeft =>
      let newIndex = max(0, state.index - 1);
      UpdateWithSideEffects(
        {...state, index: newIndex},
        _ => updateTranslation(candidateSymbols[newIndex]),
      );
    };
  },
  didUpdate: ({oldSelf, newSelf}) =>
    if (!oldSelf.retainedProps && newSelf.retainedProps) {
      newSelf.send(Activate);
    } else if (oldSelf.retainedProps && !newSelf.retainedProps) {
      newSelf.send(Deactivate);
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
               Util.ClassName.(
                 ["btn"] |> addWhen("selected", isSelected) |> serialize
               );
             <button className onClick={_ => chooseSymbol(key)} key>
               {string(key)}
             </button>;
           });
      <div className="candidates btn-group btn-group-sm"> ...keys </div>;
    };
  },
};
