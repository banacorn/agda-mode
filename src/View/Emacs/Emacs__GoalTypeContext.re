open ReasonReact;

open Rebase;

open Type.View.Emacs;

open Emacs.Component;

let component = statelessComponent("EmacsGoalTypeContext");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.Response.goalTypeContext(body);
    <>
      <ul>
        {parsed.goal
         |> Option.mapOr(
              (Goal(expr)) => <Labeled label="Goal " expr />,
              null,
            )}
        {parsed.have
         |> Option.mapOr(
              (Have(expr)) => <Labeled label="Have " expr />,
              null,
            )}
      </ul>
      <ul>
        ...{parsed.interactionMetas |> Array.map(value => <Output value />)}
      </ul>
      <ul>
        ...{parsed.hiddenMetas |> Array.map(value => <Output value />)}
      </ul>
    </>;
  },
};
