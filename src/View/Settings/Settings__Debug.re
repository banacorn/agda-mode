open ReasonReact;
open Rebase;

[@react.component]
let make = (~debug: Type.View.Debug.state, ~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-debug"] |> addWhen("hidden", hidden) |> serialize
    );
  Js.log(debug.inputMethod);
  <section className>
    <h1>
      <span className="icon icon-terminal" />
      <span> {string("Debug")} </span>
    </h1>
    <hr />
    <p> {string("only available in dev mode")} </p>
    <h2>
      <span> {string("Input Method")} </span>
      {debug.inputMethod.activated
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
        {string(Buffer.toSequence(debug.inputMethod.buffer))}
      </span>
      <br />
      {string("output buffer : ")}
      <span className="inline-block highlight">
        {string(Buffer.toSurface(debug.inputMethod.buffer))}
      </span>
    </p>
  </section>;
};
