open Rebase;

type t('a, 'e) = {
  acquire: unit => Async.t('a, 'e),
  supply: 'a => unit,
};

let make = (): t('a, 'e) => {
  let emitter = N.Events.make();

  // resource that is temporarily unavailable
  let resource = ref(None: option('a));
  // queue of callbacks waiting to be resolved
  // let queue = ref([]);
  // return the resource if it's immediately available, else waits in the queue
  let acquire = () =>
    switch (resource^) {
    | None =>
      Async.make((resolve, _) =>
        emitter |> N.Events.on("supply", resolve) |> ignore
      )
    // | None => Async.make((resolve, _) => queue := [resolve, ...queue^])
    | Some(x) => Async.resolve(x)
    };
  // iterate through the list of waiting callbacks and resolve them
  let supply = x => {
    resource := Some(x);
    emitter |> N.Events.emit("supply", x) |> ignore;
  };
  {acquire, supply};
};
