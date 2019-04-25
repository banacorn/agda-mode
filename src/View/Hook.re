open React;
open Rebase;

let useAtomListener = listener => {
  React.useEffect(() => {
    let destructor = listener();
    Some(() => Atom.Disposable.dispose(destructor));
  });
};

let useAtomListenerWhen = (listener, shouldListen) => {
  let (destructor, setDestructor) = useState(_ => None);

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
