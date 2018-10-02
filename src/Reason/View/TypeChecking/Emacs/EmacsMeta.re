open ReasonReact;

open Type.Interaction.Emacs;

open Util;

let component = ReasonReact.statelessComponent("EmacsMeta");

let make = (~meta: meta, _children) => {
  ...component,
  render: _self =>
    switch (meta) {
    | InteractionMeta(value) => <EmacsOutputConstraint value />
    | HiddenMeta(value, _) => <EmacsOutputConstraint value />
    },
};
