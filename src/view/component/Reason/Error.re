let typeErrorToHeader = error =>
  Type.TypeChecking.(
    switch (error) {
    | UnequalTerms(_, _, _, _, _) => "Unequal Terms"
    | UnregisteredTypeError(_) => "UnregisteredTypeError"
    }
  );

let errorToHeader = error =>
  Type.TypeChecking.(
    switch (error) {
    | TypeError(_, typeError) =>
      "Type Error: " ++ typeErrorToHeader(typeError)
    | Exception(_) => "Exception"
    | IOException(_) => "IOException"
    | PatternError(_) => "PatternError"
    }
  );

let component = ReasonReact.statelessComponent("Error");

let make = (~error: Js.Json.t, ~emacsMessage: string, ~emit, _children) => {
  ...component,
  render: _self => {
    let decodedError = Decoder.parseError(error);
    switch (decodedError) {
    | TypeError(range, typeError) =>
      <Context.Emitter.Provider value=emit>
        <section className="error">
          <Range range />
          <TypeError typeError emacsMessage />
        </section>
      </Context.Emitter.Provider>
    | Exception(_) =>
      <section className="error">
        (ReasonReact.string(emacsMessage))
      </section>
    | IOException(_) =>
      <section className="error">
        (ReasonReact.string(emacsMessage))
      </section>
    | PatternError(_) =>
      <section className="error">
        (ReasonReact.string("Pattern violation (you shouldn't see this)"))
      </section>
    };
  },
};

[@bs.deriving abstract]
type jsProps = {
  error: Js.Json.t,
  emacsMessage: string,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~error=errorGet(jsProps),
      ~emacsMessage=emacsMessageGet(jsProps),
      ~emit=emitGet(jsProps),
      [||],
    )
  );
