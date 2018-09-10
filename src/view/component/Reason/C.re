open ReasonReact;

open Type;

open Syntax.C;

open Util;

module NamePart = {
  let pretty: pretty(namePart) =
    part =>
      switch (part) {
      | Hole => "_"
      | Id(s) => s
      };
};

module Name = {
  let pretty: pretty(name) =
    name =>
      switch (name) {
      | Name(_, xs) => String.concat("", List.map(NamePart.pretty, xs))
      | NoName(_, _) => "_"
      };
  let isUnderscore: underscore(name) =
    name =>
      switch (name) {
      | NoName(_, _) => true
      | Name(_, [Id(x)]) => x === "_"
      | _ => false
      };
  let getRange = name =>
    switch (name) {
    | Name(range, _) => range
    | NoName(range, _) => range
    };
  let component = statelessComponent("Name");
  let make = (~value, children) => {
    ...component,
    render: _self =>
      <Link jump=true hover=true range=(getRange(value))>
        (string(pretty(value)))
      </Link>,
  };
};

module QName = {
  let component = statelessComponent("QName");
  let make = (~value, children) => {
    ...component,
    render: _self =>
      switch (value) {
      | QName([], x) => <Name value=x />
      | QName(xs, x) =>
        List.append(xs, [x])
        |> List.filter(x => ! Name.isUnderscore(x))
        |> List.map(n => <Name value=n />)
        |> sepBy(string("."))
      },
  };
};
