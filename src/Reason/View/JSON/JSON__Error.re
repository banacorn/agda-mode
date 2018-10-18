open ReasonReact;

open Type.TypeChecking;

let typeErrorToHeader = error =>
  switch (error) {
  | GenericDocError(_)
  | GenericError(_) => "Generic Error"
  | ShouldEndInApplicationOfTheDatatype(_) => "Should end in Application of the Datatype"
  | ShadowedModule(_) => "Shadowed Module"
  | ShouldBePi(_) => "Should be Pi"
  | ShouldBeASort(_) => "Should be a Sort"
  | UnequalTerms(_, _, _, _, _) => "Unequal Terms"
  | ClashingDefinition(_, _) => "Clashing Definition"
  | ModuleArityMismatch(_, _, _) => "Module Arity Mismatch"
  | NoRHSRequiresAbsurdPattern(_) => "No RHS Requires Absurd Pattern"
  | NotInScope(_) => "Not in Scope"
  | NoSuchModule(_) => "No such Module"
  | AmbiguousName(_, _) => "Ambiguous Name"
  | UnregisteredTypeError(_) => "Unregistered Type Error"
  };

let errorToHeader = error =>
  switch (error) {
  | TypeError(_, _, typeError) =>
    "Type Error: " ++ typeErrorToHeader(typeError)
  | Exception(_) => "Exception"
  | IOException(_) => "IOException"
  | PatternError(_) => "PatternError"
  };

let component = statelessComponent("Error");

let make = (~value: error, ~rawString: string, _children) => {
  ...component,
  render: _self =>
    switch (value) {
    | TypeError(range, call, typeError) =>
      <section>
        <Range range />
        <TypeError typeError rawString />
        (
          switch (call) {
          | Some(call) => <Call call />
          | None => <> </>
          }
        )
      </section>
    | Exception(_) => <section> (string(rawString)) </section>
    | IOException(_) => <section> (string(rawString)) </section>
    | PatternError(_) =>
      <section>
        (string("Pattern violation (you shouldn't see this)"))
      </section>
    },
};
