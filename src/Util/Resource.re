open Rebase;

type t('a) = {
  acquire: unit => Promise.t('a),
  supply: 'a => unit,
};
let make = (): t('a) => {
  // resource that is temporarily unavailable
  let resource = ref(None: option('a));
  // queue of callbacks waiting to be resolved
  let queue = ref([]);
  // return the resource if it's immediately available, else waits in the queue
  let acquire = () =>
    switch (resource^) {
    | None =>
      let (promise, resolve) = Promise.pending();
      queue := [resolve, ...queue^];
      promise;
    | Some(x) => Promise.resolved(x)
    };
  // iterate through the list of waiting callbacks and resolve them
  let supply = x => {
    resource := Some(x);
    queue^ |> List.forEach(resolve => resolve(x));
  };
  {acquire, supply};
};
