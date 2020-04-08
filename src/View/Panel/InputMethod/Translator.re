open Rebase;

// key - symbols mapping

[@bs.module "./../../../../../../asset/query.js"]
external rawTable: Js.Dict.t(array(string)) = "default";

// trie

type trie = {
  symbol: array(string),
  subTrie: Js.Dict.t(trie),
};
[@bs.module "./../../../../../../asset/keymap.js"]
external rawKeymapObject: Js.t({.}) = "default";

let rec fromObject = (obj: Js.t({.})): trie => {
  let symbol = [%raw {|
    obj[">>"] || []
  |}];
  let subTrie =
    obj
    |> Js.Obj.keys
    |> Array.filter(key => key != ">>")
    |> Array.map(key => (key, fromObject([%raw {|
      obj[key]
    |}])))
    |> Js.Dict.fromArray;
  {symbol, subTrie};
};

let keymap = fromObject(rawKeymapObject);

let toKeySuggestions = (trie: trie): array(string) =>
  Js.Dict.keys(trie.subTrie);

let toCandidateSymbols = (trie: trie): array(string) => trie.symbol;

// see if the key sequence is in the keymap
// returns (KeySuggestions, CandidateSymbols)
let isInKeymap = (input: string): option(trie) => {
  let rec helper = (input: string, trie: trie): option(trie) =>
    switch (String.length(input)) {
    | 0 => Some(trie)
    | n =>
      let key = String.sub(~from=0, ~length=1, input);
      let rest = String.sub(~from=1, ~length=n - 1, input);
      switch (Js.Dict.get(trie.subTrie, key)) {
      | Some(trie') => helper(rest, trie')
      | None => None
      };
    };
  helper(input, keymap);
};

// // see if the key sequence is in the extension */
// let isInExtension = (input: string): option(trie) => {};

type translation = {
  symbol: option(string),
  further: bool,
  keySuggestions: array(string),
  candidateSymbols: array(string),
};

/* converts characters to symbol, and tells if there's any further possible combinations */
let translate = (input: string): translation => {
  let trie = isInKeymap(input);
  let keySuggestions =
    trie
    |> Option.mapOr(toKeySuggestions, [||])
    |> Extension.extendKeySuggestions(input);

  let candidateSymbols =
    trie
    |> Option.mapOr(toCandidateSymbols, [||])
    |> Extension.extendCandidateSymbols(input);

  {
    symbol: candidateSymbols[0],
    further: Array.length(keySuggestions) != 0,
    keySuggestions,
    candidateSymbols,
  };
};
let initialTranslation = translate("");

let lookup = (symbol): option(array(string)) => {
  symbol
  |> Js.String.codePointAt(0)
  |> Option.map(string_of_int)
  |> Option.flatMap(Js.Dict.get(rawTable));
};