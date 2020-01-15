// open Rebase;

type t('a, 'e) = {
  emitter: Nd.Events.t,
  // resource that is temporarily unavailable
  resource: ref(option('a)),
};

let make = (): t('a, 'e) => {
  emitter: Nd.Events.make(),
  resource: ref(None: option('a)),
};

// return the resource if it's immediately available, else waits in the queue
let acquire = self =>
  switch (self.resource^) {
  | None =>
    Async.make((resolve, _) =>
      self.emitter |> Nd.Events.on("supply", resolve) |> ignore
    )
  | Some(x) => Async.resolve(x)
  };

let supply = (x, self) => {
  self.resource := Some(x);
  self.emitter |> Nd.Events.emit("supply", x) |> ignore;
};

let destroy = self => {
  self.resource := None;
  self.emitter |> Nd.Events.removeAllListeners;
};

let update = (resource, self) => {
  self.resource := Some(resource);
};
