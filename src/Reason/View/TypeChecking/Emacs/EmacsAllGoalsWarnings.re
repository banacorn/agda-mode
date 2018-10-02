open ReasonReact;

open Type.AgdaMode;

open Type.Interaction.Emacs;

let component = ReasonReact.statelessComponent("EmacsAllGoalsWarnings");

let make = (~emacsAllGoalsWarnings: allGoalsWarnings, ~emit, _children) => {
  ...component,
  render: _self =>
    <Context.Emitter.Provider value=emit>
      <section className="metas">
        <ul>
          ...(
               emacsAllGoalsWarnings.metas
               |> Array.map(meta => <EmacsMeta meta />)
             )
        </ul>
      </section>
    </Context.Emitter.Provider>,
};

[@bs.deriving abstract]
type jsProps = {
  emacsAllGoalsWarnings: allGoalsWarnings,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~emacsAllGoalsWarnings=emacsAllGoalsWarningsGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
