open ReasonReact;

open Type.Interaction.Emacs;

open Util;

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
    | Underscore(s) => <span className="expr underscore"> (string(s)) </span>
    },
};
