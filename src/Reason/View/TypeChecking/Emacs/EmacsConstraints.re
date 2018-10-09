open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsConstraints");

let make = (~constraints: string, ~emit, _children) => {
  ...component,
  render: _self => {
    Js.log(constraints);
    let parsed = Emacs.Parser.constraints(constraints);
    <Context.Emitter.Provider value=emit>
      <section className="metas">
        <ul> ...(parsed |> Array.map(value => <HiddenMeta value />)) </ul>
      </section>
    </Context.Emitter.Provider>;
  },
};

[@bs.deriving abstract]
type jsProps = {
  constraints: string,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~constraints=constraintsGet(jsProps), ~emit=emitGet(jsProps), [||])
  );
