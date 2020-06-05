open Belt;

module Main = AgdaModeVscode.States.Impl(Editor.Impl);

// semaphore with Atom.CompositeDisposable.t
let activated: ref(option(Atom.CompositeDisposable.t)) = ref(None);

// the entry point of the whole package, may be invoked several times
let activate = _ => {
  // to prevent the aforementioned problem, only activate when the semaphore is None
  if ((activated^)->Option.isNone) {
    let subscriptions = Atom.CompositeDisposable.make();
    activated := Some(subscriptions);
    Main.activate(subscriptions);
  };
  Js.Promise.resolve();
};

// only deactivate when the semaphore is Some(subscriptions)
let deactivate = _ =>
  (activated^)
  ->Option.forEach(subscriptions => {
      Atom.CompositeDisposable.dispose(subscriptions);
      activated := None;
      Main.deactivate();
    });

// https://atom.io/docs/api/latest/Config
let config = {
  "path": {
    "title": "Agda path",
    "description": "Path to the executable of Agda, automatically inferred when possible. Overwrite to override.",
    "type": "string",
    "default": "",
    "order": 0,
  },
  "libraryPath": {
    "title": "Libraries",
    "description": "Paths to include (such as agda-stdlib), seperate with comma. Useless after Agda 2.5.0",
    "type": "array",
    "default": ([||]: array(string)),
    "items": {
      "type": "string",
    },
    "order": 10,
  },
  "highlightingMethod": {
    "title": "Highlighting information passing",
    "description": "Receive parsed result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)",
    "type": "string",
    "default": "Direct",
    "enum": [|"Indirect", "Direct"|],
    "order": 20,
  },
};