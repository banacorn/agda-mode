open ReasonReact;

module OCamlString = String;

open Rebase;

exception UnhandledPromise;


module React = {
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
};

module ClassName = {
  type t = list(string);
  let add = (x: string, self): list(string) => [x, ...self];
  let addWhen = (x: string, p: bool, self): list(string) =>
    p ? add(x, self) : self;
  let serialize = String.joinWith(" ");
};

module Array_ = {
  let catMaybes = xs =>
    Array.reduceRight(
      (acc, x) =>
        switch (x) {
        | Some(v) => [v, ...acc]
        | None => acc
        },
      [],
      xs,
    )
    |> Array.fromList;
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

module Parser = {
  /* open Option; */
  let captures = (re: Js.Re.t, x: string): option(array(option(string))) =>
    Js.Re.exec(x, re)
    |> Option.map(result =>
         result |> Js.Re.captures |> Array.map(Js.Nullable.toOption)
       );
  type parser('a) =
    | Regex(Js.Re.t, array(option(string)) => option('a))
    | String(string => option('a));
  let parse = (parser: parser('a), raw: string): option('a) =>
    switch (parser) {
    | Regex(re, handler) => captures(re, raw) |> Option.flatMap(handler)
    | String(handler) => handler(raw)
    };
  let parseArray = (parser: parser('a), xs: array(string)): array('a) =>
    xs |> Array.map(raw => raw |> parse(parser)) |> Array_.catMaybes;
  let at =
      (i: int, parser: parser('a), captured: array(option(string)))
      : option('a) =>
    if (i >= Array.length(captured)) {
      None;
    } else {
      Option.flatten(captured[i]) |> Option.flatMap(parse(parser));
    };
  let choice = (res: array(parser('a))) =>
    String(
      raw =>
        Array.reduce(
          (result, parser) =>
            switch (result) {
            /* Done, pass it on */
            | Some(value) => Some(value)
            /* Failed, try this one */
            | None => parse(parser, raw)
            },
          None,
          res,
        ),
    );
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
        Js.Promise.make((~resolve, ~reject) => queue := [resolve, ...queue^])
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

exception JSPromiseError(Js.Promise.error);

module TelePromise = {
  exception Uninitialized;
  exception Expired;
  type t('a) = {
    wire: unit => Js.Promise.t('a),
    resolve: 'a => unit,
    reject: exn => unit,
  };
  let make = () => {
    let resolver = ref(None);
    let rejecter = ref(None);
    let wire = () => {
      /* reject the old wired TelePromise */
      switch (rejecter^) {
      | Some(_) => ()
      /* | Some(f) => f(. Expired) */
      | None => ()
      };
      /* make a new Promise and update the resolver and the rejecter */
      Js.Promise.make((~resolve, ~reject) => {
        resolver := Some(resolve);
        rejecter := Some(reject);
      });
    };
    let resolve = value =>
      switch (resolver^) {
      | Some(f) => f(. value)
      | None => ()
      };
    let reject = exn =>
      switch (rejecter^) {
      | Some(f) => f(. exn)
      | None => ()
      };
    {wire, resolve, reject};
  };
};
