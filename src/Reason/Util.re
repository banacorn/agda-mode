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

module Promise = {
  type t('a) = Js.Promise.t('a);
  let map: ('a => 'b, t('a)) => t('b) =
    (f, p) => p |> Js.Promise.then_(x => x |> f |> Js.Promise.resolve);

  let resolve = Js.Promise.resolve;
  let reject = Js.Promise.reject;
  let race = Js.Promise.race;
  let all = Js.Promise.all;
  let make = Js.Promise.make;
  let then_ = Js.Promise.then_;
  let catch = Js.Promise.catch;
  let thenDrop: ('a => 'b, t('a)) => unit =
    (f, x) =>
      x
      |> then_(x' => {
           f(x');
           Js.Promise.resolve();
         })
      |> ignore;
  let finally: (unit => unit, t('a)) => unit =
    (f, p) =>
      p
      |> then_(_ => {
           f();
           Js.Promise.resolve();
         })
      |> catch(_ => {
           f();
           Js.Promise.resolve();
         })
      |> ignore;

  let mapOk = f => map(Result.map(f));
  let thenOk = f =>
    then_(
      fun
      | Ok(v) => f(v)
      | Error(e) => resolve(Error(e)),
    );

  let mapError = f => map(Result.map2(x => x, f));
  let thenError = f =>
    then_(
      fun
      | Ok(v) => resolve(Ok(v))
      | Error(e) => f(e),
    );

  let recover = (handler: 'e => t('a), promise: t(result('a, 'e))): t('a) =>
    promise
    |> then_(
         fun
         | Ok(value) => resolve(value)
         | Error(err) => handler(err),
       );
};

exception JSPromiseError(Js.Promise.error);

/* module TelePromise = {
     type t('a) = {
       wire: unit => Js.Promise.t('a),
       handlePromise: Js.Promise.t('a) => unit,
       resolve: 'a => unit,
       reject: exn => unit,
     };
     let make = () => {
       let resolvers = ref([]);
       let rejecters = ref([]);
       let wire = () => {
         /* make a new Promise and enlist the new resolver and rejecter */
         Js.Promise.make((~resolve, ~reject) => {
           resolvers := [resolve, ...resolvers^];
           rejecters := [reject, ...rejecters^];
         });
       };
       let cleanup = () => {
         resolvers := [];
         rejecters := [];
       };
       let resolve = value => {
         resolvers^ |> List.forEach(resolver => resolver(. value));
         cleanup();
       };
       let reject = exn => {
         rejecters^ |> List.forEach(rejecter => rejecter(. exn));
         cleanup();
       };
       /* resolves or rejects some promise */
       let handlePromise = p =>
         p
         |> Js.Promise.then_(x => resolve(x) |> Js.Promise.resolve)
         |> Js.Promise.catch(err => {
              reject(JSPromiseError(err));
              Js.Promise.resolve();
            })
         |> ignore;
       {wire, handlePromise, resolve, reject};
     };
   }; */

module Event = {
  module Listener = {
    type t('a) = {
      resolve: (. 'a) => unit,
      id: int,
    };
    let make = (resolve, id): t('a) => {resolve, id};
  };

  type t('a) = {
    counter: ref(int),
    listeners: Js.Dict.t(Listener.t('a)),
  };

  let make = () => {counter: ref(0), listeners: Js.Dict.empty()};

  let removeListener = (_id: int, _self: t('a)) => {
    %raw
    "delete _self[1][String(_id)]";
  };

  let removeListener' = (_id: string, _self: t('a)) => {
    %raw
    "delete _self[1][_id]";
  };
  let removeAllListeners = (self: t('a)) => {
    self.listeners
    |> Js.Dict.keys
    |> Array.forEach(id => removeListener'(id, self));
  };

  let listen = (resolve: 'a => unit, self: t('a)): (unit => unit) => {
    /* get and update the ID counter  */
    let id: int = self.counter^ + 1;
    self.counter := id;
    /* store the callback */
    let listener = Listener.make((. x) => resolve(x), id);
    Js.Dict.set(self.listeners, string_of_int(id), listener);

    let destructor = () => {
      removeListener(id, self);
    };

    destructor;
  };
  let destroyWhen =
      (trigger: (unit => unit) => unit, destructor: unit => unit): unit => {
    trigger(destructor);
  };

  /* the alias of `listen` */
  let on = listen;

  let once = (self: t('a)): Js.Promise.t('a) => {
    /* get and update the ID counter  */
    let id: int = self.counter^ + 1;
    self.counter := id;
    /* makes a new promise */
    Js.Promise.make((~resolve, ~reject as _) => {
      let resolve' =
        (. x) => {
          resolve(. x);
          removeListener(id, self);
        };
      /* let reject' =
         (. x) => {
           reject(. x);
           removeListener(id, self);
         }; */
      let listener = Listener.make(resolve', id);
      Js.Dict.set(self.listeners, string_of_int(id), listener);
    });
  };

  /* successful emit */
  let resolve = (x: 'a, self: t('a)): unit => {
    self.listeners
    |> Js.Dict.values
    |> Array.forEach((listener: Listener.t('a)) => listener.resolve(. x));
  };
  /* failed emit */
  /* let reject = (x: exn, self: t('a)): unit => {
       self.listeners
       |> Js.Dict.values
       |> Array.forEach((listener: Listener.t('a)) =>
            listener.resolve(. Error(x))
          );
     }; */
  /* let handlePromise =
         (p: Js.Promise.t(result('a, 'e)), self: t(result('a, 'e))): unit => {
       p
       |> Js.Promise.then_(x => self |> resolve(x) |> Js.Promise.resolve)
       /* |> Js.Promise.catch(err => {
            self |> resolve(Error(err));
            Js.Promise.resolve();
          }) */
       |> ignore;
     }; */
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
