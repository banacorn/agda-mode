open ReasonReact;

open Type.Interaction.Emacs;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsBody");

let make = (~raw: bodyRaw, ~emit, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.body(raw);
    let header = parsed.header;
    let body = parsed.body;
    let comp =
      switch (parsed.kind) {
      | AllGoalsWarnings => <EmacsAllGoalsWarnings header body />
      | GoalTypeContext => <EmacsGoalTypeContext body />
      | Constraints => <EmacsConstraints body />
      | PlainText => <p> (string(body)) </p>
      };
    <Context.Emitter.Provider value=emit>
      <section className="agda-body"> comp </section>
    </Context.Emitter.Provider>;
  },
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
