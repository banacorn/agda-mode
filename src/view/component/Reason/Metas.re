open ReasonReact;

open Type.AgdaMode;

open Type.Interaction;

let component = ReasonReact.statelessComponent("Metas");

let make = (~metas: metas, ~emit, _children) => {
  ...component,
  render: _self =>
    <Context.Emitter.Provider value=emit>
      <section className="metas">
        <ul>
          ...(
               metas.interactionMetas
               |> List.map(meta => <Meta meta />)
               |> Array.of_list
             )
        </ul>
      </section>
      <section className="metas">
        <ul>
          ...(
               metas.hiddenMetas
               |> List.map(meta => <Meta meta />)
               |> Array.of_list
             )
        </ul>
      </section>
    </Context.Emitter.Provider>,
  /* <button />
     (string(string_of_int(List.length(metas.interactionMetas)))) */
};

[@bs.deriving abstract]
type jsProps = {
  metas,
  emit: (string, Type.Syntax.Position.range) => unit,
};

let jsComponent =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~metas=metasGet(jsProps), ~emit=emitGet(jsProps), [||])
  );
