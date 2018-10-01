open ReasonReact;

let sepBy = (sep: reactElement, item: list(reactElement)) =>
  switch (item) {
  | [] => <> </>
  | [x] => x
  | [x, ...xs] =>
    <span>
      ...(Array.of_list([x, ...List.map(i => <> sep i </>, xs)]))
    </span>
  };

let contains: (string, string) => bool = [%raw
  "function (haystack, needle) { return (haystack.indexOf(needle) !== -1)}"
];

let enclosedBy = (front: reactElement, back: reactElement, item: reactElement) =>
  <> front (string(" ")) item (string(" ")) back </>;

module Option = {
  let bind = (f: 'a => option('b), x: option('a)) : option('b) =>
    x |> Js.Option.andThen((. x') => f(x'));
  let map = (f: 'a => 'b, x: option('a)) : option('b) =>
    x |> Js.Option.map((. x') => f(x'));
};

module Array_ = {
  let catMaybes = xs =>
    Array.fold_right(
      (x, acc) =>
        switch (x) {
        | Some(v) => [v, ...acc]
        | None => acc
        },
      xs,
      [],
    );
};

module Re_ = {
  open Option;
  let captures = (re: Js.Re.t, x: string) : option(array(option(string))) =>
    Js.Re.exec(x, re)
    |> map(result =>
         result |> Js.Re.captures |> Array.map(Js.Nullable.toOption)
       );
  type parser('a) =
    | Regex(Js.Re.t, array(option(string)) => option('a))
    | String(string => option('a));
  let parse = (parser: parser('a), raw: string) : option('a) =>
    switch (parser) {
    | Regex(re, handler) => captures(re, raw) |> bind(handler)
    | String(handler) => handler(raw)
    };
  let at =
      (i: int, parser: parser('a), captured: array(option(string)))
      : option('a) =>
    if (i >= Array.length(captured)) {
      None;
    } else {
      captured[i] |> bind(parse(parser));
    };
  let choice = (res: array(parser('a))) =>
    String(
      raw =>
        Array.fold_left(
          (result, parser) =>
            switch (result) {
            /* Done, pass it on */
            | Some(value) => Some(value)
            /* Failed, try this one */
            | None => parse(parser, raw)
            },
          None,
          res,
        ),
    );
};

module List_ = {
  let sepBy = (sep: 'a, item: list('a)) : list('a) =>
    switch (item) {
    | [] => []
    | [x, ...xs] => [x, ...xs |> List.map(i => [sep, i]) |> List.concat]
    };
  let rec init = xs =>
    switch (xs) {
    | [] => failwith("init on empty list")
    | [_] => []
    | [x, ...xs] => [x, ...init(xs)]
    };
  let rec last = xs =>
    switch (xs) {
    | [] => failwith("last on empty list")
    | [x] => x
    | [x, ...xs] => last(xs)
    };
  let rec span = (p, xs) =>
    switch (xs) {
    | [] => ([], [])
    | [x, ...xs] =>
      if (p(x)) {
        let (ys, zs) = span(p, xs);
        ([x, ...ys], zs);
      } else {
        ([], xs);
      }
    };
  let rec dropWhile = (p, xs) =>
    switch (xs) {
    | [] => []
    | [x, ...xs] =>
      if (p(x)) {
        dropWhile(p, xs);
      } else {
        [x, ...xs];
      }
    };
};
