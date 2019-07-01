open ReasonReact;

type uri =
  | Root
  | Connection
  | Log
  | UnicodeInput
  | Debug;

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
       | Log =>
         <li>
           <a href="#">
             <span className="icon icon-comment-discussion">
               {string("Log")}
             </span>
           </a>
         </li>
       | UnicodeInput =>
         <li>
           <a href="#">
             <span className="icon icon-keyboard">
               {string("Unicode Input")}
             </span>
           </a>
         </li>
       | Debug =>
         <li>
           <a href="#">
             <span className="icon icon-terminal"> {string("Debug")} </span>
           </a>
         </li>
       }}
    </ol>
  </nav>;
