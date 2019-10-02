open Rebase;

[@bs.module "./../../../../../asset/keymap.js"]
external rawKeymap: Js.t({.}) = "default";

[@bs.module "./../../../../../asset/query.js"]
external rawTable: Js.Dict.t(array(string)) = "default";

type trie = {
  symbol: array(string),
  subTrie: Js.Dict.t(trie),
};

let rec toTrie = (obj: Js.t({.})): trie => {
  let symbol = [%raw {|
    obj[">>"] || ""
  |}];
  let subTrie =
    obj
    |> Js.Obj.keys
    |> Array.filter(key => key != ">>")
    |> Array.map(key => (key, toTrie([%raw {|
      obj[key]
    |}])))
    |> Js.Dict.fromArray;
  {symbol, subTrie};
};

let keymap = toTrie(rawKeymap);

let toKeySuggestions = (trie: trie): array(string) =>
  Js.Dict.keys(trie.subTrie);

let toCandidateSymbols = (trie: trie): array(string) => trie.symbol;

/* see if the underlying is in the keymap */
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

type translation = {
  symbol: option(string),
  further: bool,
  keySuggestions: array(string),
  candidateSymbols: array(string),
};

/* converts characters to symbol, and tells if there's any further possible combinations */
let translate = (input: string): translation => {
  // move the last element to the first
  let shiftRight = xs =>
    switch (Js.Array.pop(xs)) {
    | None => [||]
    | Some(x) =>
      Js.Array.unshift(x, xs) |> ignore;
      xs;
    };

  switch (isInKeymap(input)) {
  | Some(trie) =>
    let keySuggestions = Js.Array.sortInPlace(toKeySuggestions(trie));
    let candidateSymbols =
      switch (input) {
      // TODO: find a better solution for this workaround of issue #72
      | "^l" => toCandidateSymbols(trie) |> shiftRight
      | "^r" => toCandidateSymbols(trie) |> shiftRight
      | _ => toCandidateSymbols(trie)
      };
    {
      symbol: candidateSymbols[0],
      further: Array.length(keySuggestions) != 0,
      keySuggestions,
      candidateSymbols,
    };
  | None =>
    /* key combination out of keymap
       replace with closest the symbol possible */
    {
      symbol: None,
      further: false,
      keySuggestions: [||],
      candidateSymbols: [||],
    }
  };
};
let initialTranslation = translate("");

let lookup = (symbol): option(array(string)) => {
  symbol
  |> Js.String.codePointAt(0)
  |> Option.map(string_of_int)
  |> Option.flatMap(Js.Dict.get(rawTable));
};
