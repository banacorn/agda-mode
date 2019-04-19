open Rebase;

module React = {
  open ReasonReact;
  let sepBy = (sep: reactElement, item: list(reactElement)) =>
    switch (item) {
    | [] => <> </>
    | [x] => x
    | [x, ...xs] =>
      <span>
        ...{Array.fromList([x, ...List.map(i => <> sep i </>, xs)])}
      </span>
    };
  let enclosedBy =
      (front: reactElement, back: reactElement, item: reactElement) =>
    <> front {string(" ")} item {string(" ")} back </>;

  let manyIn = elem =>
    ReactDOMRe.createDOMElementVariadic(elem, ~props=ReactDOMRe.domProps());
};

module ClassName = {
  type t = list(string);
  let add = (x: string, self): list(string) => [x, ...self];
  let addWhen = (x: string, p: bool, self): list(string) =>
    p ? add(x, self) : self;
  let serialize = String.joinWith(" ");
};

module Result = {
  type t('a, 'e) = result('a, 'e);
  let every = (xs: array(t('a, 'e))): t(array('a), 'e) =>
    Array.reduce(
      (acc, x) =>
        switch (acc, x) {
        | (Ok(xs), Ok(v)) =>
          xs |> Js.Array.push(v) |> ignore;
          Ok(xs);
        | (_, Error(e)) => Error(e)
        | (Error(e), _) => Error(e)
        },
      Ok([||]),
      xs,
    );
  /* let some = (xs: array(t('a, 'e))): t(array('a), 'e) =>
     Array.reduce(
       (acc, x) =>
         switch (acc, x) {
         | (Ok(xs), Ok(v)) =>
           xs |> Js.Array.push(v) |> ignore;
           Ok(xs);
         | (Ok(xs), Error(_)) => Ok(xs)
         | (Error(_), Ok(v)) => Ok([|v|])
         | (Error(e), Error(_)) => Error(e)
         },
       Ok([||]),
       xs,
     ); */
};
module Array_ = {
  // let catMaybes = xs =>
  //   Array.reduceRight(
  //     (acc, x) =>
  //       switch (x) {
  //       | Some(v) => [v, ...acc]
  //       | None => acc
  //       },
  //     [],
  //     xs,
  //   )
  //   |> Array.fromList;
  let partite = (p: 'a => bool, xs: array('a)): array(array('a)) => {
    let indices: array(int) =
      xs
      |> Array.mapi((x, i) => (x, i))  /* zip with index */
      |> Array.filter(((x, _)) => p(x))  /* filter bad indices out */
      |> Array.map(snd); /* leave only the indices */
    /* prepend 0 as the first index */
    let indicesWF: array(int) =
      switch (indices[0]) {
      | Some(n) => n === 0 ? indices : Array.concat(indices, [|0|])
      | None => Array.length(indices) === 0 ? [|0|] : indices
      };
    let intervals: array((int, int)) =
      indicesWF
      |> Array.mapi((index, n) =>
           switch (indicesWF[n + 1]) {
           | Some(next) => (index, next)
           | None => (index, Array.length(xs))
           }
         );
    intervals |> Array.map(((from, to_)) => xs |> Array.slice(~from, ~to_));
  };
  let mergeWithNext:
    (array('a) => bool, array(array('a))) => array(array('a)) =
    p =>
      Array.reduce(
        (acc, x) => {
          let last = acc[Array.length(acc) - 1];
          switch (last) {
          | None => [|x|]
          | Some(l) =>
            if (p(l)) {
              acc[Array.length(acc) - 1] = Array.concat(x, l);
              acc;
            } else {
              Array.concat([|x|], acc);
            }
          };
        },
        [||],
      );
};

module Dict = {
  open Js.Dict;
  let partite =
      (tagEntry: (('a, int)) => option(string), xs: array('a))
      : t(array('a)) => {
    let keys: array((key, int)) =
      xs
      |> Array.mapi((x, i) => (x, i))  /* zip with index */
      |> Array.filterMap(((x, i)) =>
           tagEntry((x, i)) |> Option.map(key => (key, i))
         );
    let intervals: array((key, int, int)) =
      keys
      |> Array.mapi(((key, index), n) =>
           switch (keys[n + 1]) {
           | Some((_, next)) => (key, index, next)
           | None => (key, index, Array.length(xs))
           }
         );
    intervals
    |> Array.map(((key, from, to_)) =>
         (key, xs |> Array.slice(~from, ~to_))
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
      |> Array.forEach(((k, v)) => set(dict, k, v));
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
    | [x, ...xs] => [x, ...xs |> List.flatMap(i => [sep, i])]
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

module Resource = {
  type t('a) = {
    acquire: unit => Js.Promise.t('a),
    supply: 'a => unit,
  };
  let make = (): t('a) => {
    /* resource that is temporarily unavailable */
    let resource = ref(None: option('a));
    /* queue of callbacks waiting to be resolved */
    let queue = ref([]);
    /* return the resource if it's immediately available,
         else waits in the queue
       */
    let acquire = () =>
      switch (resource^) {
      | None =>
        Js.Promise.make((~resolve, ~reject as _) =>
          queue := [resolve, ...queue^]
        )
      | Some(x) => Js.Promise.resolve(x)
      };
    /* iterate through the list of waiting callbacks and resolve them  */
    let supply = x => {
      resource := Some(x);
      queue^ |> List.forEach(resolve => resolve(. x));
    };
    {acquire, supply};
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

module Semver = {
  [@bs.module "semver"] external gte: (string, string) => bool = "";
  [@bs.module "semver"] external coerce: string => string = "";
};
