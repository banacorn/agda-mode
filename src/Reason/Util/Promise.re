open Rebase;

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
