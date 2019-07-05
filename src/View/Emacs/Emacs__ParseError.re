open ReasonReact;

[@react.component]
let make = (~metadata: Metadata.t) => {
  <section>
    <p>
      {string(
         "Something went terribly wrong when trying to parse some responses from Agda",
       )}
    </p>
    <p className="text-warning">
      {string(
         "Please press the button down here, copy the generated log and paste it ",
       )}
      <a href="https://github.com/banacorn/agda-mode/issues/new">
        {string("here")}
      </a>
    </p>
    <p>
      <button
        onClick={_ => Metadata.dump(metadata)}
        className="btn btn-primary icon icon-clippy">
        {string("Dump log")}
      </button>
    </p>
  </section>;
};
