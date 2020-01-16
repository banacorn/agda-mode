type t('input, 'output) = Resource.t('input => Promise.t('output));

let make = Resource.make;

let send = (input, channel) =>
  channel.Resource.acquire()->Promise.flatMap(trigger => trigger(input));

let sendTo = (channel, input) =>
  channel.Resource.acquire()->Promise.flatMap(trigger => trigger(input));

let recv = (callback, channel) => channel.Resource.supply(callback);
