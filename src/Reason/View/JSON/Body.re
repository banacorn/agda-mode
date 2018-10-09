open ReasonReact;

open Type.Interaction;

open EmacsComponent;

let component = ReasonReact.statelessComponent("JSONBody");

let make = (~raw: bodyRaw, ~emit, _children) => {
  ...component,
  render: _self =>
    <Context.Emitter.Provider value=emit>
      <section className="agda-body">
        (
          switch (Decoder.parseBody(raw)) {
          | AllGoalsWarnings(value) => <AllGoalsWarnings value />
          | Error(value, rawString) => <Error value rawString />
          | PlainText(s) => <p> (string(s)) </p>
          }
        )
      </section>
    </Context.Emitter.Provider>,
};

[@bs.deriving abstract]
type jsProps = {
  raw: bodyRaw,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~raw=rawGet(jsProps), ~emit=emitGet(jsProps), [||])
  );
