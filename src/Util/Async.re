/* Type Safe Promise */
open Rebase;
module P = Js.Promise;

type t('a, 'e) = P.t(result('a, 'e));

let make = (callback: ('a => unit, 'e => unit) => unit): t('a, 'e) => {
  P.make((~resolve, ~reject as _) => {
    let resolve' = x => resolve(. Ok(x));
    let reject = x => resolve(. Error(x));
    callback(resolve', reject);
  });
};

let resolve = x => P.resolve(Ok(x));
let reject = x => P.resolve(Error(x));

/* (A -> Either B E) -> A -> Async B E */
let lift: ('i => Result.t('o, 'e), 'i) => t('o, 'e) =
  (f, x) =>
    switch (f(x)) {
    | Ok(x) => resolve(x)
    | Error(x) => reject(x)
    };

let fromPromise = (promise: P.t('a)): t('a, Js.Exn.t) => {
  promise |> P.then_(x => resolve(x));
};

let map = (f: 'a => 'b, g: 'e => 'f): (t('a, 'e) => t('b, 'f)) =>
  P.then_(
    fun
    | Ok(v) => resolve(f(v))
    | Error(e) => reject(g(e)),
  );

let pass = (f: result('a, 'e) => unit): (t('a, 'e) => t('a, 'e)) =>
  P.then_(
    fun
    | Ok(v) => {
        f(Ok(v));
        resolve(v);
      }
    | Error(e) => {
        f(Error(e));
        reject(e);
      },
  );

let mapOk = (f: 'a => 'b): (t('a, 'e) => t('b, 'e)) => map(f, e => e);

let passOk = (f: 'a => unit): (t('a, 'e) => t('a, 'e)) =>
  pass(
    fun
    | Ok(v) => f(v)
    | Error(_) => (),
  );

let thenOk = (f: 'a => t('b, 'e)): (t('a, 'e) => t('b, 'e)) =>
  P.then_(
    fun
    | Ok(v) => f(v)
    | Error(e) => reject(e),
  );

let finalOk: ('a => 'b, t('a, 'e)) => unit =
  (f, p) => p |> thenOk(x => f(x) |> resolve) |> ignore;

let mapError = (f: 'e => 'f): (t('a, 'e) => t('a, 'f)) => map(v => v, f);

let passError = (f: 'e => unit): (t('a, 'e) => t('a, 'e)) =>
  pass(
    fun
    | Ok(_) => ()
    | Error(e) => f(e),
  );

let thenError: ('e => t('a, 'f), t('a, 'e)) => t('a, 'f) =
  f =>
    P.then_(
      fun
      | Ok(v) => resolve(v)
      | Error(e) => f(e),
    );

let finalError: ('e => 'f, t('a, 'e)) => unit =
  (f, p) => p |> thenError(e => f(e) |> resolve) |> ignore;

let flatten: (result('e, 'f) => 'g, t(result('a, 'e), 'f)) => t('a, 'g) =
  merge =>
    P.then_(
      fun
      | Ok(Ok(v)) => resolve(v)
      | Ok(Error(e)) => reject(merge(Ok(e)))
      | Error(f) => reject(merge(Error(f))),
    );

let all: array(t('a, 'e)) => t(array('a), 'e) =
  xs => {
    xs |> P.all |> P.then_(xs => xs |> Util.Result.every |> P.resolve);
  };
