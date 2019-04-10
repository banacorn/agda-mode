/* open Async; */
open Rebase;

module Listener = {
  type t('a, 'e) = {
    resolve: result('a, 'e) => unit,
    id: int,
  };
  let make = (resolve, id): t('a, 'e) => {resolve, id};
  let map = (f: 'a => 'b, g: 'e => 'f, listener: t('b, 'f)): t('a, 'e) => {
    resolve: (x: result('a, 'e)) =>
      x |> Result.map2(f, g) |> listener.resolve,
    id: listener.id,
  };
};

type t('a, 'e) = {
  counter: ref(int),
  listeners: Js.Dict.t(Listener.t('a, 'e)),
};

let make = () => {counter: ref(0), listeners: Js.Dict.empty()};

let removeListener = (_id: int, _self: t('a, 'e)) => {
  %raw
  "delete _self[1][String(_id)]";
};

let removeListener' = (_id: string, _self: t('a, 'e)) => {
  %raw
  "delete _self[1][_id]";
};
let removeAllListeners = (self: t('a, 'e)) => {
  self.listeners
  |> Js.Dict.keys
  |> Array.forEach(id => removeListener'(id, self));
};

let listen =
    (callback: result('a, 'e) => unit, self: t('a, 'e)): (unit => unit) => {
  /* get and update the ID counter  */
  let id: int = self.counter^ + 1;
  self.counter := id;
  /* store the callback */
  let listener = Listener.make(callback, id);
  Js.Dict.set(self.listeners, string_of_int(id), listener);

  /* returns the destructor */
  let destructor = () => {
    removeListener(id, self);
  };
  destructor;
};

let destroyWhen =
    (trigger: (unit => unit) => unit, destructor: unit => unit): unit => {
  trigger(destructor);
};

/* alias of `listen` */
let on = listen;

let map = (f: 'a => 'b, g: 'e => 'f, x: t('b, 'f)): t('a, 'e) => {
  counter: x.counter,
  listeners: x.listeners |> Js.Dict.map((. l) => l |> Listener.map(f, g)),
};

let onOk: ('a => unit, t('a, 'e), unit) => unit =
  callback =>
    on(
      fun
      | Ok(a) => callback(a)
      | Error(_) => (),
    );

let onError: ('e => unit, t('a, 'e), unit) => unit =
  callback =>
    on(
      fun
      | Ok(_) => ()
      | Error(e) => callback(e),
    );

let once = (self: t('a, 'e)): Async.t('a, 'e) => {
  /* get and update the ID counter  */
  let id: int = self.counter^ + 1;
  self.counter := id;
  /* makes a new promise */
  Async.make((resolve, reject) => {
    let callback =
      fun
      | Ok(a) => {
          resolve(a);
          removeListener(id, self);
        }
      | Error(e) => {
          reject(e);
          removeListener(id, self);
        };

    let listener = Listener.make(callback, id);
    Js.Dict.set(self.listeners, string_of_int(id), listener);
  });
};

/* successful emit */
let emitOk = (x: 'a, self: t('a, 'e)): unit => {
  self.listeners
  |> Js.Dict.values
  |> Array.forEach((listener: Listener.t('a, 'e)) =>
       listener.resolve(Ok(x))
     );
};
/* failed emit */
let emitError = (x: 'e, self: t('a, 'e)): unit => {
  self.listeners
  |> Js.Dict.values
  |> Array.forEach((listener: Listener.t('a, 'e)) =>
       listener.resolve(Error(x))
     );
};

/* from |> pipe(to_) */
let pipe = (to_: t('a, 'e), from: t('a, 'e)): (unit => unit) =>
  from
  |> on(
       fun
       | Ok(ok) => to_ |> emitOk(ok)
       | Error(err) => to_ |> emitError(err),
     );

let pipeMap = (to_: t('b, 'e), f: 'a => 'b, from: t('a, 'e)): (unit => unit) =>
  from
  |> on(
       fun
       | Ok(ok) => to_ |> emitOk(f(ok))
       | Error(err) => to_ |> emitError(err),
     );
