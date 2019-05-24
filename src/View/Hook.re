open Rebase;

let useState = init => {
  let (state, setState) = React.useState(_ => init);
  let setState' = value => setState(_ => value);
  (state, setState');
};

let useAtomListener = listener => {
  React.useEffect(() => {
    let destructor = listener();
    Some(() => Atom.Disposable.dispose(destructor));
  });
};

let useAtomListenerWhen = (listener, shouldListen) => {
  let (destructor, setDestructor) = React.useState(_ => None);

  React.useEffect1(
    () => {
      if (shouldListen) {
        let destructor = listener();
        setDestructor(_ => Some(() => Atom.Disposable.dispose(destructor)));
      } else {
        // execute the destructor
        destructor |> Option.forEach(f => f());
      };

      // return the destructor in case that it got unmounted
      destructor;
    },
    [|shouldListen|],
  );
};

let useListenWhen = (listener, shouldListen) => {
  let (destructor, setDestructor) = React.useState(_ => None);

  React.useEffect1(
    () => {
      if (shouldListen) {
        setDestructor(_ => listener());
      } else {
        // execute the destructor
        destructor
        |> Option.forEach(f => {
             f();
             setDestructor(_ => None);
           });
      };
      None;
    },
    // destructor;
    [|shouldListen|],
  );
};

let useEventListener = (listener, emitter) => {
  React.useEffect1(
    () => emitter |> Event.onOk(listener) |> Option.some,
    [||],
  );
};
