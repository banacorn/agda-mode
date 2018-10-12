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
          |> Util.Option.option(ReasonReact.null, (Goal(expr)) =>
               <Labeled label="Goal " expr />
             )
        )
        (
          parsed.have
          |> Util.Option.option(ReasonReact.null, (Have(expr)) =>
               <Labeled label="Have " expr />
             )
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
