open ReasonReact;

let component = ReasonReact.statelessComponent("JSONBody");

let make = (~raw, ~emacs, ~useJSON, ~emit, _children) => {
  ...component,
  render: _self => {
    let comp =
      if (useJSON) {
        switch (Decoder.parseBody(raw)) {
        | AllGoalsWarnings(value) => <AllGoalsWarnings value />
        | Error(value, rawString) => <Error value rawString />
        | PlainText(s) => <p> (string(s)) </p>
        };
      } else {
        let parsed = Emacs.Parser.body(emacs);
        let header = parsed.header;
        let body = parsed.body;
        switch (parsed.kind) {
        | AllGoalsWarnings => <EmacsAllGoalsWarnings header body />
        | GoalTypeContext => <EmacsGoalTypeContext body />
        | Constraints => <EmacsConstraints body />
        | PlainText => <p> (string(body)) </p>
        };
      };
    <Context.Emitter.Provider value=emit>
      <section className="agda-body"> comp </section>
    </Context.Emitter.Provider>;
  },
};

[@bs.deriving abstract]
type jsProps = {
  raw: Type.Interaction.bodyRaw,
  emacs: Type.Interaction.Emacs.bodyRaw,
  useJSON: bool,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~raw=rawGet(jsProps),
      ~emacs=emacsGet(jsProps),
      ~useJSON=useJSONGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
