// open Rebase;

type t('a, 'e) = {
  emitter: N.Events.t,
  // resource that is temporarily unavailable
  resource: ref(option('a)),
};

let make = (): t('a, 'e) => {
  emitter: N.Events.make(),
  resource: ref(None: option('a)),
};

// return the resource if it's immediately available, else waits in the queue
let acquire = self =>
  switch (self.resource^) {
  | None =>
    Async.make((resolve, _) =>
      self.emitter |> N.Events.on("supply", resolve) |> ignore
    )
  | Some(x) => Async.resolve(x)
  };

let supply = (x, self) => {
  self.resource := Some(x);
  self.emitter |> N.Events.emit("supply", x) |> ignore;
};
