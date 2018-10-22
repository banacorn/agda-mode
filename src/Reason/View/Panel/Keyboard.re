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
      |> Util.addClass("hidden", ! activated)
      |> Util.toClassName;
    let bufferClassName =
      ["inline-block", "buffer"]
      |> Util.addClass("hidden", String.isEmpty(buffer))
      |> Util.toClassName;
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

[@bs.deriving abstract]
type jsProps = {
  activated: bool,
  buffer: string,
  keySuggestions: array(string),
  candidateSymbols: array(string),
  /* callbacks */
  updateTranslation: option(string) => unit,
  insertCharacter: string => unit,
  chooseSymbol: string => unit,
};

let jsComponent =
  wrapReasonForJs(~component, jsProps =>
    make(
      ~activated=activatedGet(jsProps),
      ~buffer=bufferGet(jsProps),
      ~keySuggestions=keySuggestionsGet(jsProps),
      ~candidateSymbols=candidateSymbolsGet(jsProps),
      ~updateTranslation=updateTranslationGet(jsProps),
      ~insertCharacter=insertCharacterGet(jsProps),
      ~chooseSymbol=chooseSymbolGet(jsProps),
      [||],
    )
  );
