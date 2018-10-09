open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsGoalTypeContext");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.goalTypeContext(body);
    <>
      <ul>
        (
          parsed.goal
          |> Util.Option.option(ReasonReact.null, value => <Goal value />)
        )
        (
          parsed.have
          |> Util.Option.option(ReasonReact.null, value => <Have value />)
        )
      </ul>
      <ul>
        ...(parsed.interactionMetas |> Array.map(value => <Output value />))
      </ul>
      <ul>
        ...(parsed.hiddenMetas |> Array.map(value => <Output value />))
      </ul>
    </>;
  },
};
