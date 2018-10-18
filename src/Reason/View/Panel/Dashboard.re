/* open ReasonReact;

   open Rebase;

   let component = statelessComponent("Header");

   let make = (~header, ~emit, _children) => {
     ...component,
     render: _self => {},
   };

   [@bs.deriving abstract]
   type jsProps = {
     header: string,
     emit: (string, Type.Syntax.Position.range) => unit,
   };

   let jsComponent =
     wrapReasonForJs(~component, jsProps =>
       make(~header=headerGet(jsProps), ~emit=emitGet(jsProps), [||])
     ); */
