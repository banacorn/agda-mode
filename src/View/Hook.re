open Rebase;

let useDidUpdateEffect = (f, inputs) => {
  let didMountRef = React.useRef(false);
  React.useEffect1(
    () =>
      if (React.Ref.current(didMountRef)) {
        f();
      } else {
        React.Ref.setCurrent(didMountRef, true);
        None;
      },
    inputs,
  );
};

let useDidUpdateEffect2 = (f, (a, b)) => {
  let didMountRef = React.useRef(false);
  React.useEffect2(
    () =>
      if (React.Ref.current(didMountRef)) {
        f();
      } else {
        React.Ref.setCurrent(didMountRef, true);
        None;
      },
    (a, b),
  );
};

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

let useChannel = (callback, channel) => {
  React.useEffect1(
    () => {
      channel |> Channel.recv(callback);
      None;
    },
    [||],
  );
};
