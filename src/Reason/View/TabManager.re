open ReasonReact;

open Webapi.Dom;

open Js.Promise;

open Atom;

type state = {panel: bool};

type action =
  | Open;

let component = ReasonReact.reducerComponent("TabManager");

let make = (~editor: TextEditor.t, _children) => {
  ...component,
  initialState: () => {panel: false},
  reducer: (action: action, state: state) =>
    switch (action) {
    | Open => NoUpdate
    },
  render: _self => <> <Tab editor /> </>,
};
