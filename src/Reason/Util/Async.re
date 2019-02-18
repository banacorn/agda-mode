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
let fromPromise = (promise: P.t('a)): t('a, Js.Exn.t) => {
  promise |> P.then_(x => resolve(x));
};
let all = P.all;

let map: ('a => 'b, 'e => 'f, t('a, 'e)) => t('b, 'f) =
  (f, g) =>
    P.then_(
      fun
      | Ok(v) => resolve(f(v))
      | Error(e) => reject(g(e)),
    );

let mapOk: ('a => 'b, t('a, 'e)) => t('b, 'e) =
  f =>
    P.then_(
      fun
      | Ok(v) => resolve(f(v))
      | Error(e) => reject(e),
    );

let thenOk: ('a => t('b, 'e), t('a, 'e)) => t('b, 'e) =
  f =>
    P.then_(
      fun
      | Ok(v) => f(v)
      | Error(e) => reject(e),
    );

let finalOk: ('a => 'b, t('a, 'e)) => unit =
  (f, p) => p |> thenOk(x => f(x) |> resolve) |> ignore;

let mapError: ('e => 'f, t('a, 'e)) => t('a, 'f) =
  f =>
    P.then_(
      fun
      | Ok(v) => resolve(v)
      | Error(e) => reject(f(e)),
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

/* module Pure = {
     type t('a) = P.t('a);

     let make = (callback: ('a => unit) => unit): t('a) => {
       P.make((~resolve, ~reject as _) => {
         let resolve' = x => resolve(. x);
         callback(resolve');
       });
     };
     let resolve = P.resolve;
     let map: ('a => 'b, t('a)) => t('b) = f => P.then_(v => resolve(f(v)));
     let then_: ('a => t('b), t('a)) => t('b) = P.then_;
   }; */
/*
 let catch: ('e => 'a, t('a, 'e)) => t('a, unit) =
   f =>
     P.then_(
       fun
       | Ok(v) => resolve(v)
       | Error(e) => resolve(f(e)),
     ); */
