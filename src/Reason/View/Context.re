/* Courtesy of @jaredly */
/* https://gist.github.com/jaredly/951177b8f5518bfbd19aa1a5ce093e7b */
type pair;

[@bs.get] external provider : pair => ReasonReact.reactClass = "Provider";

[@bs.get] external consumer : pair => ReasonReact.reactClass = "Consumer";

[@bs.module "react"] external createContext : 'a => pair = "";

module MakePair = (Config: {type t; let defaultValue: t;}) => {
  let _pair = createContext(Config.defaultValue);
  module Provider = {
    let make = (~value: Config.t, children) =>
      ReasonReact.wrapJsForReason(
        ~reactClass=provider(_pair),
        ~props={"value": value},
        children,
      );
  };
  module Consumer = {
    let make = (children: Config.t => ReasonReact.reactElement) =>
      ReasonReact.wrapJsForReason(
        ~reactClass=consumer(_pair),
        ~props=Js.Obj.empty(),
        children,
      );
  };
};

module Emitter =
  MakePair(
    {
      type t = (string, Type.Syntax.Position.range) => unit;
      let defaultValue = (_, _) => ();
    },
  );
