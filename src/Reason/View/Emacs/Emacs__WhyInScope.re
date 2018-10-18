open ReasonReact;

open Emacs.Component;

open Rebase;

let component = statelessComponent("EmacsWhyInScope");

let make = (~body: string, ~jump=false, _children) => {
  ...component,
  render: _self => {
    let (value, ranges) = Emacs.Parser.Response.whyInScope(body);
    /* <Context.Emitter.Consumer>
       ...(
            emit => {
              if (jump) {
                switch (ranges[0]) {
                | None => ()
                | Some(range) =>
                  Js.log(range);
                  emit("EVENT.JUMP_TO_RANGE", range);
                };
              }; */
    <p> <PlainText value /> </p>;
    /* }
            )
       </Context.Emitter.Consumer>; */
  },
};
