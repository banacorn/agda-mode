open ReasonReact;

open Type.Syntax.Literal;

open Component;

let component = statelessComponent("Literal");

let make = (~value, _children) => {
  ...component,
  render: _self =>
    switch (value) {
    | LitNat(range, n) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string(string_of_int(n))}
      </Link>
    | LitWord64(range, n) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string(string_of_int(n))}
      </Link>
    | LitFloat(range, n) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string(Js.Float.toString(n))}
      </Link>
    | LitString(range, s) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string("\"" ++ s ++ "\"")}
      </Link>
    | LitChar(range, c) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string("'" ++ String.make(1, c) ++ "'")}
      </Link>
    | LitQName(range, name) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string(name)}
      </Link>
    | LitMeta(range, _, n) =>
      <Link jump=true hover=true target={RangeLink(range)}>
        {string("_" ++ string_of_int(n))}
      </Link>
    },
};
