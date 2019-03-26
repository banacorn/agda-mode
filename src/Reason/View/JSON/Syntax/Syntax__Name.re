open ReasonReact;

open Type.Syntax.Name;

open Component;

module NamePart = {
  let toString: namePart => string =
    part =>
      switch (part) {
      | Hole => "_"
      | Id(s) => s
      };
};

module Name = {
  let toString: name => string =
    name =>
      switch (name) {
      | Name(_, xs) => String.concat("", List.map(NamePart.toString, xs))
      | NoName(_, _) => "_"
      };
  let isUnderscore: name => bool =
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
  let make = (~value, _children) => {
    ...component,
    render: _self =>
      <Link jump=true hover=true range={getRange(value)}>
        {string(toString(value))}
      </Link>,
  };
};

module QName = {
  let toString: qname => string =
    name => {
      let QName(xs, x) = name;
      List.append(xs, [x])
      |> List.filter(x => !Name.isUnderscore(x))
      |> List.map(Name.toString)
      |> String.concat(".");
    };
  let rec getRange = name =>
    switch (name) {
    | QName([], x) => Name.getRange(x)
    | QName([x', ...xs], x) =>
      Type.Location.Range.fuse(getRange(QName(xs, x')), Name.getRange(x))
    };
  let unqualify = (QName(xs, x)) => {
    let range = getRange(QName(xs, x));
    switch (x) {
    | Name(_, xs) => Name(range, xs)
    | NoName(_, x) => NoName(range, x)
    };
  };
  /* Name(getRange(QName(xs, x)), ); */
  let moduleParts = (QName(xs, _)) => xs;
  let component = statelessComponent("QName");
  /* let modulePart =  */
  let make = (~value, _children) => {
    ...component,
    render: _self =>
      switch (value) {
      | QName([], x) => <Name value=x />
      | QName(xs, x) =>
        List.append(xs, [x])
        |> List.filter(x => !Name.isUnderscore(x))
        |> List.map(n => <Name value=n />)
        |> Util.React.sepBy(string("."))
      },
  };
};

module BoundName = {
  let component = statelessComponent("BoundName");
  let isUnderscore: boundName => bool =
    value =>
      if (Name.toString(value.name) === Name.toString(value.label)) {
        Name.isUnderscore(value.name);
      } else {
        false;
      };
  let make = (~value, _children) => {
    ...component,
    render: _self =>
      if (Name.toString(value.name) === Name.toString(value.label)) {
        <Name value={value.name} />;
      } else {
        <span>
          <Name value={value.label} />
          {string("=")}
          <Name value={value.name} />
        </span>;
      },
  };
};
