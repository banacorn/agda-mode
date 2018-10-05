open ReasonReact;

open Type.Interaction.Emacs;

let component = ReasonReact.statelessComponent("EmacsGoalTypeContext");

let make = (~goalTypeContext: string, ~emit, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.goalTypeContext(goalTypeContext);
    Js.log(parsed.metas);
    <Context.Emitter.Provider value=emit>
      <section className="metas">
        <ul> ...(parsed.metas |> Array.map(meta => <EmacsMeta meta />)) </ul>
      </section>
    </Context.Emitter.Provider>;
  },
};

[@bs.deriving abstract]
type jsProps = {
  goalTypeContext: string,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~goalTypeContext=goalTypeContextGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
