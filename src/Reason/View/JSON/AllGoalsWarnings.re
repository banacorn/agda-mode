open ReasonReact;

open Type.Interaction;

let component = ReasonReact.statelessComponent("AllGoalsWarnings");

let make = (~value: allGoalsWarnings, _children) => {
  ...component,
  render: _self => {
    let interactionMetas =
      <ul className="metas">
        ...(
             value.interactionMetas
             |> List.map(meta => <OutputConstraint meta />)
             |> Array.of_list
           )
      </ul>;
    let hiddenMetas =
      <ul className="metas">
        ...(
             value.hiddenMetas
             |> List.map(meta => <OutputConstraint meta />)
             |> Array.of_list
           )
      </ul>;
    let warnings =
      <ul className="warnings">
        ...Type.TypeChecking.(
             value.warnings
             |> List.map(x => <li> (string(x.warning')) </li>)
             |> Array.of_list
           )
      </ul>;
    <>
      (
        List.length(value.interactionMetas) > 0 ?
          interactionMetas : ReasonReact.null
      )
      (List.length(value.hiddenMetas) > 0 ? hiddenMetas : ReasonReact.null)
      (List.length(value.warnings) > 0 ? warnings : ReasonReact.null)
    </>;
  },
};
