open ReasonReact;

open Type.AgdaMode;

open Type.Interaction;

let component = ReasonReact.statelessComponent("AllGoalsWarnings");

let make = (~allGoalsWarnings: allGoalsWarnings, ~emit, _children) => {
  ...component,
  render: _self =>
    <Context.Emitter.Provider value=emit>
      <section className="metas">
        <ul>
          ...(
               allGoalsWarnings.interactionMetas
               |> List.map(meta => <Meta meta />)
               |> Array.of_list
             )
        </ul>
      </section>
      <section className="metas">
        <ul>
          ...(
               allGoalsWarnings.hiddenMetas
               |> List.map(meta => <Meta meta />)
               |> Array.of_list
             )
        </ul>
      </section>
      <section className="warnings">
        <ul>
          ...Type.TypeChecking.(
               allGoalsWarnings.warnings
               |> List.map(x => <li> (string(x.warning')) </li>)
               |> Array.of_list
             )
        </ul>
      </section>
    </Context.Emitter.Provider>,
};

[@bs.deriving abstract]
type jsProps = {
  allGoalsWarnings,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~allGoalsWarnings=allGoalsWarningsGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
