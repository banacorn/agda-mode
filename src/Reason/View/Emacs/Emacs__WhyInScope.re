open ReasonReact;

open Emacs.Component;

let component = statelessComponent("EmacsWhyInScope");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let value = Emacs.Parser.Response.whyInScope(body);
    <p> <PlainText value /> </p>;
  },
};
