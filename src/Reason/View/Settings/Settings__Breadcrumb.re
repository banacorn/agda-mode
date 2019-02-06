open ReasonReact;

open Rebase;

open Type.View;

let component = statelessComponent("Breadcrumb");

type uri =
  | Root
  | Connection
  | Protocol;

let make = (~uri: uri, ~onNavigate: uri => unit, _children) => {
  ...component,
  render: _self => {
    <nav className="agda-settings-breadcrumb">
      <ol className="breadcrumb">
        <li>
          <a href="#" onClick={_ => onNavigate(Root)}>
            <span className="icon icon-settings"> {string("Settings")} </span>
          </a>
        </li>
        {switch (uri) {
         | Root => null
         | Connection =>
           <li>
             <a href="#">
               <span className="icon icon-plug">
                 {string("Connection")}
               </span>
             </a>
           </li>
         | Protocol =>
           <li>
             <a href="#">
               <span className="icon icon-comment-discussion">
                 {string("Protocol")}
               </span>
             </a>
           </li>
         }}
      </ol>
    </nav>;
  },
};
