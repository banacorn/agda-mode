open ReasonReact;

open Type.Interaction.Emacs;

module Term = {
  let component = ReasonReact.statelessComponent("EmacsTerm");
  let jump = true;
  let hover = true;
  let make = (~term: term, _children) => {
    ...component,
    render: _self =>
      switch (term) {
      | Plain(s) => <span className="expr"> (string(s)) </span>
      | QuestionMark(s) =>
        <Link className=["expr", "question-mark"] jump hover range=NoRange>
          (string(s))
        </Link>
      | Underscore(s) =>
        <span className="expr underscore"> (string(s)) </span>
      },
  };
};

module Expr = {
  let component = ReasonReact.statelessComponent("EmacsExpr");
  let make = (~expr: expr, _children) => {
    ...component,
    render: _self =>
      expr
      |> Array.map(term => <Term term />)
      |> (terms => <span> ...terms </span>),
  };
};

module OutputConstraint = {
  let component = ReasonReact.statelessComponent("EmacsOutputConstraint");
  let make = (~value: outputConstraint, _children) => {
    ...component,
    render: _self =>
      switch (value) {
      | OfType(e, t) =>
        <li> <Expr expr=e /> (string(" : ")) <Expr expr=t /> </li>
      | JustType(e) => <li> (string("Type ")) <Expr expr=e /> </li>
      | JustSort(e) => <li> (string("Sort ")) <Expr expr=e /> </li>
      | Others(e) => <li> <Expr expr=e /> </li>
      },
  };
};

module Labeled = {
  let component = ReasonReact.statelessComponent("EmacsGoal");
  let make = (~label: string, ~expr: expr, _children) => {
    ...component,
    render: _self =>
      <li className="labeled">
        <span className="label"> (string(label)) </span>
        <Expr expr />
      </li>,
  };
};

module Output = {
  let component = ReasonReact.statelessComponent("EmacsInteractionMeta");
  let make = (~value: output, _children) => {
    ...component,
    render: _self => {
      let Output(oc, _r) = value;
      <OutputConstraint value=oc />;
    },
  };
};

module RawError = {
  let component = ReasonReact.statelessComponent("EmacsRawError");
  let make = (~value: array(string), _children) => {
    ...component,
    render: _self =>
      Array.length(value) === 0 ?
        ReasonReact.null :
        <p className="error">
          (string(value |> Array.to_list |> String.concat("\n")))
        </p>,
  };
};
