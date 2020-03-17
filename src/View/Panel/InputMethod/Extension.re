// For adding or prioritizing key mapping
open Rebase;
open Fn;
open Json.Decode;

type keymap = Js.Dict.t(array(string));

let defaultKeymap = () => {
  let keymap = Js.Dict.empty();
  Js.Dict.set(keymap, "^r", [|{js|ʳ|js}|]);
  Js.Dict.set(keymap, "^l", [|{js|ˡ|js}|]);
  keymap;
};

let readConfig = () => {
  switch (
    Js.undefinedToOption(Atom.Config.get("agda-mode.inputMethodExtension"))
  ) {
  | None => "{}"
  | Some(s) => s
  };
};

let setConfig = keymap => {
  open! Json.Encode;

  let encoder: keymap => Js.Json.t = dict(array(string));

  Atom.Config.set(
    "agda-mode.inputMethodExtension",
    Json.stringify(encoder(keymap)),
  )
  |> ignore;
};

let parse: string => option(keymap) =
  Json.parse >> Option.map(dict(array(string)));

let readKeymap = readConfig >> parse >> Option.getOr(Js.Dict.empty());

let lookup = key => Js.Dict.get(readKeymap(), key) |> Option.getOr([||]);

let add = (key, symbols) => {
  let keymap = readKeymap();
  switch (Js.Dict.get(keymap, key)) {
  | None => Js.Dict.set(keymap, key, symbols)
  | Some(existing) =>
    // put the existing symbols in the back
    Js.Dict.set(keymap, key, Array.concat(existing, symbols))
  };

  setConfig(keymap);
};

let modify = (key, symbols) => {
  let keymap = readKeymap();
  Js.Dict.set(keymap, key, symbols);
  setConfig(keymap);
};

let delete = key => {
  let keymap = readKeymap();
  let delete': string => unit = [%raw
    "function (id) {
      delete keymap[id]
    }"
  ];
  delete'(key);
  setConfig(keymap);
};

let resetToDefault = () => {
  setConfig(defaultKeymap());
};

let extendKeySuggestions = (key, origionalSuggestions) => {
  let extension =
    readKeymap()
    |> Js.Dict.keys
    |> Array.filter(String.startsWith(key))
    |> Array.map(String.sub(~from=String.length(key), ~length=1))
    |> Array.filter(s => String.length(s) === 1);

  // no repeated elements
  let union = (xs, ys) => {
    ys |> Array.filter(y => !Js.Array.includes(y, xs)) |> Array.concat(xs);
  };

  union(origionalSuggestions, extension) |> Js.Array.sortInPlace;
};

// if the extened symbols are prioritized over the origional ones
let extendCandidateSymbols = (key, originalCandidates) => {
  let extension = lookup(key);

  let removedOverlaps =
    originalCandidates |> Array.filter(s => !Js.Array.includes(s, extension)); // remove the overlapping symbols
  // prefix the extension symbols
  Array.concat(removedOverlaps, extension);
};