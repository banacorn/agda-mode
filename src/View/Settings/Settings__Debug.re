open ReasonReact;
open Rebase;

open Type.View.Debug;

[@react.component]
let make = (~debug: state, ~hidden) => {
  let {inputMethod} = debug;
  let className =
    Util.ClassName.(
      ["agda-settings-debug"] |> addWhen("hidden", hidden) |> serialize
    );
  <section className>
    <h1>
      <span className="icon icon-terminal" />
      <span> {string("Debug")} </span>
    </h1>
    <p> {string("only available in dev mode")} </p>
    <hr />
    <h2>
      <span> {string("Input Method")} </span>
      {inputMethod.activated
         ? <span
             title="activated"
             id="input-method-activation"
             className="icon icon-primitive-dot text-success"
           />
         : <span
             title="deactivated"
             id="input-method-activation"
             className="icon icon-primitive-dot text-error"
           />}
    </h2>
    <p>
      {string("input sequence : ")}
      <span className="inline-block highlight">
        {string(Buffer.toSequence(inputMethod.buffer))}
      </span>
    </p>
    <p>
      {string("output buffer : ")}
      <span className="inline-block highlight">
        {string(Buffer.toSurface(inputMethod.buffer))}
      </span>
    </p>
    <p>
      {string("# of markers : ")}
      <span className="inline-block highlight">
        {string(string_of_int(Array.length(inputMethod.markers)))}
      </span>
    </p>
    <div className="block">
      <button className="btn" onClick={_ => Js.log(inputMethod.markers)}>
        {string("Dump Markers")}
      </button>
    </div>
  </section>;
};
