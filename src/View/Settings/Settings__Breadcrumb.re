open ReasonReact;

type uri =
  | Root
  | Connection
  | UnicodeInput
  | Debug
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
       | UnicodeInput =>
         <li>
           <a href="#">
             <span className="icon icon-keyboard">
               {string("Unicode Input")}
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
       | Debug =>
         <li>
           <a href="#">
             <span className="icon icon-terminal"> {string("Debug")} </span>
           </a>
         </li>
       }}
    </ol>
  </nav>;
