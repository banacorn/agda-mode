open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsGoalTypeContext");

let make = (~goalTypeContext: string, ~emit, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.goalTypeContext(goalTypeContext);
    <Context.Emitter.Provider value=emit>
      <section className="metas">
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
