open ReasonReact;

open Rebase;

open Type.View.Emacs;

open Component;

module Term = {
  let component = statelessComponent("EmacsTerm");
  let jump = true;
  let hover = true;
  let make = (~term: term, _children) => {
    ...component,
    render: _self =>
      switch (term) {
      | Plain(s) => <span className="expr"> {string(s)} </span>
      | QuestionMark(s) =>
        <Link className=["expr", "question-mark"] jump hover range=NoRange>
          {string(s)}
        </Link>
      | Underscore(s) =>
        <span className="expr underscore"> {string(s)} </span>
      },
  };
};

module Expr = {
  let component = statelessComponent("EmacsExpr");
  let make = (~expr: expr, _children) => {
    ...component,
    render: _self =>
      expr
      |> Array.map(term => <Term term />)
      |> (terms => <span> ...terms </span>),
  };
};

module OutputConstraint = {
  let component = statelessComponent("EmacsOutputConstraint");
  let make =
      (
        ~value: outputConstraint,
        ~range: option(Type.Location.Range.t),
        _children,
      ) => {
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
  let make = (~label: string, ~expr: expr, _children) => {
    ...component,
    render: _self =>
      <li className="labeled">
        <span className="label"> {string(label)} </span>
        <Expr expr />
      </li>,
  };
};

module Output = {
  let component = statelessComponent("EmacsInteractionMeta");
  let make = (~value: output, _children) => {
    ...component,
    render: _self => {
      let Output(oc, range) = value;
      <OutputConstraint value=oc range />;
    },
  };
};

module PlainText = {
  let component = statelessComponent("PlainText");
  let make = (~value: array(textOrRange), _children) => {
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
  let component = statelessComponent("WarningError");
  let make = (~value: warningError, _children) => {
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
