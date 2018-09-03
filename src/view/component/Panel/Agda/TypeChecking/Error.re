let typeErrorToHeader = error =>
  Type.Agda.TypeChecking.(
    switch (error) {
    | UnequalTerms(_, _, _, _, _) => "Unequal Terms"
    | UnregisteredTypeError(_) => "UnregisteredTypeError"
    }
  );

let errorToHeader = error =>
  Type.Agda.TypeChecking.(
    switch (error) {
    | TypeError(_, typeError) =>
      "Type Error: " ++ typeErrorToHeader(typeError)
    | Exception(_) => "Exception"
    | IOException(_) => "IOException"
    | PatternError(_) => "PatternError"
    }
  );

let component = ReasonReact.statelessComponent("Error");

let make = (~error: Js.Json.t, ~emacsMessage: string, _children) => {
  ...component,
  render: _self => {
    let decodedError = Decoder.parseError(error);
    Type.Agda.TypeChecking.(
      switch (decodedError) {
      | TypeError(_, _) =>
        <p className="error"> (ReasonReact.string("TypeError!")) </p>
      | Exception(_) =>
        <p className="error"> (ReasonReact.string(emacsMessage)) </p>
      | IOException(_) =>
        <p className="error"> (ReasonReact.string(emacsMessage)) </p>
      | PatternError(_) =>
        <p className="error">
          (ReasonReact.string("Pattern violation (you shouldn't see this)"))
        </p>
      }
    );
  },
};

/* let rangeToAtomRanges = range => map((),range)
   static toAtomRanges(range: Syntax.Position.Range): Atom.Range[] {
       return range.intervals.map(({ start, end }) => new Atom.Range(
           new Atom.Point(start[0] - 1, start[1] - 1),
           new Atom.Point(end[0] - 1, end[1] - 1),
       ));
   } */
[@bs.deriving abstract]
type jsProps = {
  error: Js.Json.t,
  emacsMessage: string,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~error=errorGet(jsProps),
      ~emacsMessage=emacsMessageGet(jsProps),
      [||],
    )
  );
