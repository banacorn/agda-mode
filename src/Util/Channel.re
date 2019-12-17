type t('input, 'output, 'error) =
  Resource.t('input => Async.t('output, 'error), 'error);

let make = Resource.make;

let send = (input, channel) =>
  channel |> Resource.acquire |> Async.thenOk(trigger => trigger(input));

let recv = (callback, channel) => channel |> Resource.supply(callback);
