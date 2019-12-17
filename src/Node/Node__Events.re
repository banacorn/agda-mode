// Node Events API
include Node__Type.Events;

// constructor
[@bs.module "events"] [@bs.new] external make: unit => t = "EventEmitter";

// emitter.emit(eventName, arg)
[@bs.send.pipe: t] external emit: (string, 'a) => bool = "emit";

// emitter.on(eventName, listener)
[@bs.send.pipe: t] external on: (string, 'a => unit) => t = "on";

// emitter.once(eventName, listener)
[@bs.send.pipe: t] external once: (string, 'a => unit) => t = "once";

// emitter.removeAllListeners()
[@bs.send.pipe: t] external removeAllListeners: t = "removeAllListeners";
