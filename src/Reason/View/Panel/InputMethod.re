open Rebase;

[@bs.module "././asset/keymap"] external rawKeymap : Js.t({.}) = "default";

/* import Keymap from './asset/keymap'; */
type trie = {
  symbol: option(string),
  subTrie: Js.Dict.t(trie),
};

let rec toTrie = (obj: Js.t({.})) : trie => {
  let symbol = [%raw {|
  obj[">>"]
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
