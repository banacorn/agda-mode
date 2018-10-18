open ReasonReact;

open Rebase;

open Emacs.Component;

let component = statelessComponent("EmacsSearchAbout");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let (target, outputs) = Emacs.Parser.Response.searchAbout(body);
    Array.length(outputs) === 0 ?
      <p> (string("There are no definitions about " ++ target)) </p> :
      <>
        <p> (string("Definitions about " ++ target ++ ":")) </p>
        <ul> ...(outputs |> Array.map(value => <Output value />)) </ul>
      </>;
  },
};
