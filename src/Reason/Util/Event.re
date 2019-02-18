/* open Async; */
open Rebase;

module Listener = {
  type t('a, 'e) = {
    resolve: 'a => unit,
    reject: 'e => unit,
    id: int,
  };
  /* let make = (resolve, id): t('a, 'e) => {resolve, id}; */
  let make = (resolve, reject, id): t('a, 'e) => {resolve, reject, id};
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
    (resolve: 'a => unit, reject: 'e => unit, self: t('a, 'e))
    : (unit => unit) => {
  /* get and update the ID counter  */
  let id: int = self.counter^ + 1;
  self.counter := id;
  /* store the callback */
  let listener = Listener.make(resolve, reject, id);
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

let onOk = resolve => on(resolve, _ => ());

let once = (self: t('a, 'e)): Async.t('a, 'e) => {
  /* get and update the ID counter  */
  let id: int = self.counter^ + 1;
  self.counter := id;
  /* makes a new promise */
  Async.make((resolve, reject) => {
    let resolve' = x => {
      resolve(x);
      removeListener(id, self);
    };
    let reject' = x => {
      reject(x);
      removeListener(id, self);
    };
    let listener = Listener.make(resolve', reject', id);
    Js.Dict.set(self.listeners, string_of_int(id), listener);
  });
};

/* successful emit */
let resolve = (x: 'a, self: t('a, 'e)): unit => {
  self.listeners
  |> Js.Dict.values
  |> Array.forEach((listener: Listener.t('a, 'e)) => listener.resolve(x));
};
/* failed emit */
let reject = (x: 'e, self: t('a, 'e)): unit => {
  self.listeners
  |> Js.Dict.values
  |> Array.forEach((listener: Listener.t('a, 'e)) => listener.reject(x));
};
