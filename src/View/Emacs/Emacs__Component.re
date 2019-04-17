open Rebase.Option;

open ReasonReact;

open Rebase;

open Component;

module Term = {
  type t =
    | Plain(string)
    | QuestionMark(int)
    | Underscore(string);
  let component = statelessComponent("EmacsTerm");
  let jump = true;
  let hover = true;
  let make = (~term: t, _children) => {
    ...component,
    render: _self =>
      switch (term) {
      | Plain(s) => <span className="expr"> {string(s)} </span>
      | QuestionMark(i) =>
        <Link
          className=["expr", "question-mark"]
          jump
          hover
          target={HoleLink(i)}>
          {string("?" ++ string_of_int(i))}
        </Link>
      | Underscore(s) =>
        <span className="expr underscore"> {string(s)} </span>
      },
  };
};

module Expr = {
  type t = array(Term.t);

  let parse = raw => {
    raw
    |> String.trim
    /*                            1         2                        */
    |> Util.safeSplitByRe([%re "/(\\?\\d+)|(\\_\\d+[^\\}\\)\\s]*)/"])
    |> Array.mapi((token, i) =>
         switch (i mod 3) {
         | 1 =>
           token
           |> map(Js.String.sliceToEnd(~from=1))
           |> flatMap(Parser.int)
           |> map(x => Term.QuestionMark(x))
         | 2 => token |> map(x => Term.Underscore(x))
         | _ => token |> map(x => Term.Plain(x))
         }
       )
    |> Array.filterMap(x => x)
    |> some;
  };

  let component = statelessComponent("EmacsExpr");
  let make = (~expr: t, _children) => {
    ...component,
    render: _self =>
      expr
      |> Array.map(term => <Term term />)
      |> (terms => <span> ...terms </span>),
  };
};

module OutputConstraint = {
  type t =
    | OfType(Expr.t, Expr.t)
    | JustType(Expr.t)
    | JustSort(Expr.t)
    | Others(Expr.t);

  let parseOfType =
    [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"]
    |> Parser.captures(captured =>
         captured
         |> Parser.at(2, Expr.parse)
         |> flatMap(type_ =>
              captured
              |> Parser.at(1, Expr.parse)
              |> flatMap(term => Some(OfType(term, type_)))
            )
       );
  let parseJustType =
    [%re "/^Type ((?:\\n|.)+)/"]
    |> Parser.captures(captured =>
         captured
         |> Parser.at(1, Expr.parse)
         |> map(type_ => JustType(type_))
       );
  let parseJustSort =
    [%re "/^Sort ((?:\\n|.)+)/"]
    |> Parser.captures(captured =>
         captured |> Parser.at(1, Expr.parse) |> map(sort => JustSort(sort))
       );
  let parseOthers = raw => raw |> Expr.parse |> map(raw' => Others(raw'));

  let parse =
    Parser.choice([|parseOfType, parseJustType, parseJustSort, parseOthers|]);

  let component = statelessComponent("EmacsOutputConstraint");
  let make = (~value: t, ~range: option(Type.Location.Range.t), _children) => {
    ...component,
    render: _self =>
      switch (value) {
      | OfType(e, t) =>
        <li className="output">
          <Expr expr=e />
          {string(" : ")}
          <Expr expr=t />
          {Option.mapOr(range => <Range range abbr=true />, null, range)}
        </li>
      | JustType(e) =>
        <li className="output">
          {string("Type ")}
          <Expr expr=e />
          {Option.mapOr(range => <Range range abbr=true />, null, range)}
        </li>
      | JustSort(e) =>
        <li className="output">
          {string("Sort ")}
          <Expr expr=e />
          {Option.mapOr(range => <Range range abbr=true />, null, range)}
        </li>
      | Others(e) =>
        <li className="output">
          <Expr expr=e />
          {Option.mapOr(range => <Range range abbr=true />, null, range)}
        </li>
      },
  };
};

module Labeled = {
  let component = statelessComponent("EmacsGoal");
  let make = (~label: string, ~expr: Expr.t, _children) => {
    ...component,
    render: _self =>
      <li className="labeled">
        <span className="label"> {string(label)} </span>
        <Expr expr />
      </li>,
  };
};

module Output = {
  type t =
    | Output(OutputConstraint.t, option(Type.Location.Range.t));

  let parseOutputWithoutRange = raw =>
    raw |> OutputConstraint.parse |> map(x => Output(x, None));
  let parseOutputWithRange =
    [%re "/((?:\\n|.)*\\S+)\\s*\\[ at ([^\\]]+) \\]/"]
    |> Parser.captures(captured =>
         flatten(captured[1])
         |> flatMap(OutputConstraint.parse)
         |> map(oc => {
              let r =
                flatten(captured[2]) |> flatMap(Type.Location.Range.parse);
              Output(oc, r);
            })
       );
  let parse = raw => {
    let rangeRe = [%re
      "/\\[ at (\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+)) \\]$/"
    ];
    let hasRange = Js.Re.test_(rangeRe, raw);
    if (hasRange) {
      raw |> parseOutputWithRange;
    } else {
      raw |> parseOutputWithoutRange;
    };
  };

  let component = statelessComponent("EmacsInteractionMeta");
  let make = (~value: t, _children) => {
    ...component,
    render: _self => {
      let Output(oc, range) = value;
      <OutputConstraint value=oc range />;
    },
  };
};

module PlainText = {
  type t =
    | Text(string)
    | Range(Type.Location.Range.t);
  let parse = raw =>
    raw
    |> Util.safeSplitByRe(
         [%re "/(\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+))/"],
       )
    |> Array.filterMap(x => x)
    |> Array.mapi((token, i) =>
         switch (i mod 2) {
         | 1 =>
           token
           |> Type.Location.Range.parse
           |> mapOr(x => Range(x), Text(token))
         | _ => Text(token)
         }
       )
    |> some;

  let component = statelessComponent("PlainText");
  let make = (~value: array(t), _children) => {
    ...component,
    render: _self =>
      <span>
        ...{
             value
             |> Array.map(token =>
                  switch (token) {
                  | Text(plainText) => string(plainText)
                  | Range(range) => <Range range />
                  }
                )
           }
      </span>,
  };
};

module WarningError = {
  type t =
    | WarningMessage(array(PlainText.t))
    | ErrorMessage(array(PlainText.t));
  let parse = (isWarning, raw) =>
    raw
    |> PlainText.parse
    |> map(body => isWarning ? WarningMessage(body) : ErrorMessage(body));

  let parseWarning = parse(true);

  let parseError = parse(false);

  let component = statelessComponent("WarningError");
  let make = (~value: t, _children) => {
    ...component,
    render: _self =>
      switch (value) {
      | WarningMessage(body) =>
        <li className="warning-error">
          <span className="warning-label"> {string("warning")} </span>
          <PlainText value=body />
        </li>
      | ErrorMessage(body) =>
        <li className="warning-error">
          <span className="error-label"> {string("error")} </span>
          <PlainText value=body />
        </li>
      },
  };
};
