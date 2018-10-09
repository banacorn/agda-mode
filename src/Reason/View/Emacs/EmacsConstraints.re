open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsConstraints");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.constraints(body);
    <section className="metas">
      <ul> ...(parsed |> Array.map(value => <Output value />)) </ul>
    </section>;
  },
};
