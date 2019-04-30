
open ReasonReact;

type uri =
  | Root
  | Connection
  | Protocol;

[@react.component]
let make = (~uri: uri, ~onNavigate: uri => unit) =>
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
             <span className="icon icon-plug"> {string("Connection")} </span>
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
