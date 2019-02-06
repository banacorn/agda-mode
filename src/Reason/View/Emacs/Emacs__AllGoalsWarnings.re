open ReasonReact;

open Type.View.Emacs;

open Emacs.Component;

let component = statelessComponent("EmacsAllGoalsWarnings");

let make = (~value: allGoalsWarnings, _children) => {
  ...component,
  render: _self => {
    let {interactionMetas, hiddenMetas, warnings, errors} = value;
    <>
      <ul> ...{interactionMetas |> Array.map(value => <Output value />)} </ul>
      <ul> ...{hiddenMetas |> Array.map(value => <Output value />)} </ul>
      <ul> ...{warnings |> Array.map(value => <WarningError value />)} </ul>
      <ul> ...{errors |> Array.map(value => <WarningError value />)} </ul>
    </>;
  },
};
