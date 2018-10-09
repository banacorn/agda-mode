open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsAllGoalsWarnings");

let make = (~header: string, ~allGoalsWarnings: string, ~emit, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.allGoalsWarnings(header, allGoalsWarnings);
    <Context.Emitter.Provider value=emit>
      <section className="metas">
        <ul>
          ...(parsed.interactionMetas |> Array.map(value => <Output value />))
        </ul>
        <ul>
          ...(parsed.hiddenMetas |> Array.map(value => <Output value />))
        </ul>
        <RawError value=parsed.warnings />
        <RawError value=parsed.errors />
      </section>
    </Context.Emitter.Provider>;
  },
};

[@bs.deriving abstract]
type jsProps = {
  header: string,
  allGoalsWarnings: string,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~header=headerGet(jsProps),
      ~allGoalsWarnings=allGoalsWarningsGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
