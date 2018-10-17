open ReasonReact;

open Type.Interaction.Emacs;

open Emacs.Component;

let component = statelessComponent("EmacsAllGoalsWarnings");

let make = (~header: string, ~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.Response.allGoalsWarnings(header, body);
    <>
      <ul>
        ...(parsed.interactionMetas |> Array.map(value => <Output value />))
      </ul>
      <ul>
        ...(parsed.hiddenMetas |> Array.map(value => <Output value />))
      </ul>
      <ul>
        ...(parsed.warnings |> Array.map(value => <WarningError value />))
      </ul>
      <ul>
        ...(parsed.errors |> Array.map(value => <WarningError value />))
      </ul>
    </>;
  },
};
