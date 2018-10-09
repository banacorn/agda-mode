open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsAllGoalsWarnings");

let make = (~header: string, ~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.allGoalsWarnings(header, body);
    <section className="metas">
      <ul>
        ...(parsed.interactionMetas |> Array.map(value => <Output value />))
      </ul>
      <ul>
        ...(parsed.hiddenMetas |> Array.map(value => <Output value />))
      </ul>
      <RawError value=parsed.warnings />
      <RawError value=parsed.errors />
    </section>;
  },
};
