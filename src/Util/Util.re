open Belt;

module React = {
  open ReasonReact;

  let manyIn = (elems, elem) =>
    ReactDOMRe.createDOMElementVariadic(
      elem,
      ~props=ReactDOMRe.domProps(),
      elems,
    );

  let manyIn2 = (elems, elem, props) =>
    ReactDOMRe.createDOMElementVariadic(elem, ~props, elems);

  let sepBy' = (item: list(reactElement), sep: reactElement) =>
    switch (item) {
    | [] => <> </>
    | [x] => x
    | [x, ...xs] =>
      [x, ...List.map(xs, i => <> sep i </>)]->List.toArray->manyIn("span")
    };
  let sepBy = (sep: reactElement, xs) => xs->List.fromArray->sepBy'(sep);

  let enclosedBy =
      (front: reactElement, back: reactElement, item: reactElement) =>
    <> front {string(" ")} item {string(" ")} back </>;

  let when_ = (p, className) => p ? " " ++ className : "";
  let showWhen =
    fun
    | true => ""
    | false => " hidden";
};

module Result = {
  type t('a, 'e) = result('a, 'e);
  let every = (xs: array(t('a, 'e))): t(array('a), 'e) =>
    Array.reduce(xs, Ok([||]), (acc, x) =>
      switch (acc, x) {
      | (Ok(xs), Ok(v)) =>
        Js.Array.push(v, xs) |> ignore;
        Ok(xs);
      | (_, Error(e)) => Error(e)
      | (Error(e), _) => Error(e)
      }
    );
};

module Array_ = {
  let partite = (p: 'a => bool, xs: array('a)): array(array('a)) => {
    let indices: array(int) =
      xs
      ->Array.mapWithIndex((i, x) => (i, x)) /* zip with index */
      ->Array.keep(((_, x)) => p(x)) /* filter bad indices out */
      ->Array.map(fst); /* leave only the indices */
    /* prepend 0 as the first index */
    let indicesWF: array(int) =
      switch (indices[0]) {
      | Some(n) => n === 0 ? indices : Array.concat(indices, [|0|])
      | None => Array.length(indices) === 0 ? [|0|] : indices
      };
    let intervals: array((int, int)) =
      indicesWF->Array.mapWithIndex((n, index) =>
        switch (indicesWF[n + 1]) {
        | Some(next) => (index, next)
        | None => (index, Array.length(xs))
        }
      );
    intervals->Array.map(((start, end_)) =>
      xs |> Js.Array.slice(~start, ~end_)
    );
  };
  let mergeWithNext:
    (array('a) => bool, array(array('a))) => array(array('a)) =
    (p, xs) =>
      xs->Array.reduce(
        [||],
        (acc, x) => {
          let last = acc[Array.length(acc) - 1];
          switch (last) {
          | None => [|x|]
          | Some(l) =>
            if (p(l)) {
              (acc[Array.length(acc) - 1] = Array.concat(x, l)) |> ignore;
              acc;
            } else {
              Array.concat([|x|], acc);
            }
          };
        },
      );
};

module Dict = {
  open Js.Dict;
  let partite =
      (tagEntry: (('a, int)) => option(string), xs: array('a))
      : t(array('a)) => {
    let keys: array((key, int)) =
      xs
      ->Array.mapWithIndex((i, x) => (i, x)) /* zip with index */
      ->Array.keepMap(((i, x)) =>
          tagEntry((x, i))->Option.map(key => (key, i))
        );
    let intervals: array((key, int, int)) =
      keys->Array.mapWithIndex((n, (key, index)) =>
        switch (keys[n + 1]) {
        | Some((_, next)) => (key, index, next)
        | None => (key, index, Array.length(xs))
        }
      );
    intervals->Array.map(((key, start, end_)) =>
      (key, xs->Js.Array.slice(~start, ~end_))
    )
    |> fromArray;
  };
  /* split an entry */
  let split =
      (key: key, splitter: 'a => t('a), dict: t('a)): t(array(string)) =>
    switch (get(dict, key)) {
    | Some(value) =>
      /* insert new entries */
      entries(splitter(value))
      ->Array.forEach(((k, v)) => set(dict, k, v));
      dict;
    | None => dict
    };
  let update = (key: key, f: 'a => 'a, dict: t('a)): t('a) =>
    switch (get(dict, key)) {
    | Some(value) =>
      set(dict, key, f(value));
      dict;
    | None => dict
    };
};

module List_ = {
  let sepBy = (sep: 'a, item: list('a)): list('a) =>
    switch (item) {
    | [] => []
    | [x, ...xs] => [x, ...xs->List.map(i => [sep, i])->List.flatten]
    };
  let rec init = xs =>
    switch (xs) {
    | [] => failwith("init on empty list")
    | [_] => []
    | [x, ...xs] => [x, ...init(xs)]
    };
  let rec last = xs =>
    switch (xs) {
    | [] => failwith("last on empty list")
    | [x] => x
    | [_, ...xs] => last(xs)
    };
  let rec span = (p, xs) =>
    switch (xs) {
    | [] => ([], [])
    | [x, ...xs] =>
      if (p(x)) {
        let (ys, zs) = span(p, xs);
        ([x, ...ys], zs);
      } else {
        ([], xs);
      }
    };
  let rec dropWhile = (p, xs) =>
    switch (xs) {
    | [] => []
    | [x, ...xs] =>
      if (p(x)) {
        dropWhile(p, xs);
      } else {
        [x, ...xs];
      }
    };
};

module String = {
  let toCharArray = (input: string): array(string) => {
    input |> Js.String.split("");
  };
  let indexOf = (needle, haystack) => {
    switch (Js.String.indexOf(needle, haystack)) {
    | (-1) => None
    | n => Some(n)
    };
  };
  let lastIndexOf = (needle, haystack) => {
    switch (Js.String.lastIndexOf(needle, haystack)) {
    | (-1) => None
    | n => Some(n)
    };
  };
  /* return the number of blank characters at the front */
  /* ' ', '\012', '\n', '\r', and '\t' */
  let indentedBy = s => {
    let n = ref(0);
    for (i in 0 to Js.String.length(s) - 1) {
      switch (Js.String.charAt(i, s)) {
      | " "
      | "\012"
      | "\n"
      | "\r"
      | "\t" =>
        if (i == n^) {
          n := n^ + 1;
        }
      | _ => ()
      };
    };
    n^;
  };
};

module JsError = {
  let toString = (_e: Js.Exn.t) => {
    %raw
    "_e.toString()";
  };
};

/* TODO: https://github.com/BuckleScript/bucklescript/pull/3123 */
[@bs.send.pipe: Js.String.t]
external safeSplitByRe: Js_re.t => array(option(Js.String.t)) = "split";

// module Semver = {
//   [@bs.module "semver"] external gte: (string, string) => bool = "";
//   [@bs.module "semver"] external coerce: string => string = "";
// };

module Version = {
  type ordering =
    | LT
    | EQ
    | GT;

  [@bs.module]
  external compareVersionsPrim: (string, string) => int = "compare-versions";
  let trim = Js.String.replaceByRe([%re "/-.*/"], "");
  let compare = (a, b) =>
    switch (compareVersionsPrim(trim(a), trim(b))) {
    | (-1) => LT
    | 0 => EQ
    | _ => GT
    };
  let gte = (a, b) =>
    switch (compare(a, b)) {
    | EQ
    | GT => true
    | LT => false
    };
};

module Pretty = {
  let list = xs => {
    let xs_ = xs |> Rebase.String.joinWith(", ");
    "[" ++ xs_ ++ "]";
  };
  let array = xs => xs |> Rebase.List.fromArray |> list;
};