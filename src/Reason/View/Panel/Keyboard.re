open ReasonReact;

open Rebase;

let component = statelessComponent("Keyboard");

let make =
    (
      ~activated: bool,
      ~buffer: string,
      ~keySuggestions: array(string),
      ~candidateSymbols: array(string),
      /* callbacks */
      ~updateTranslation: option(string) => unit,
      ~insertCharacter: string => unit,
      ~chooseSymbol: string => unit,
      _children,
    ) => {
  ...component,
  render: _self => {
    let className =
      ["input-method"]
      |> Util.React.addClass("hidden", ! activated)
      |> Util.React.toClassName;
    let bufferClassName =
      ["inline-block", "buffer"]
      |> Util.React.addClass("hidden", String.isEmpty(buffer))
      |> Util.React.toClassName;
    <section className>
      <div className="keyboard">
        <div className=bufferClassName> (string(buffer)) </div>
        <div className="keys btn-group btn-group-sm">
          ...(
               keySuggestions
               |> Array.map(key =>
                    <button
                      className="btn"
                      onClick=((_) => insertCharacter(key))
                      key>
                      (string(key))
                    </button>
                  )
             )
        </div>
      </div>
      <CandidateSymbols updateTranslation chooseSymbol candidateSymbols />
    </section>;
  },
};
