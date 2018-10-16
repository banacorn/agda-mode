open ReasonReact;

open Rebase;

let sepBy = (sep: reactElement, item: list(reactElement)) =>
  switch (item) {
  | [] => <> </>
  | [x] => x
  | [x, ...xs] =>
    <span>
      ...(Array.fromList([x, ...List.map(i => <> sep i </>, xs)]))
    </span>
  };

let enclosedBy = (front: reactElement, back: reactElement, item: reactElement) =>
  <> front (string(" ")) item (string(" ")) back </>;

module Array_ = {
  let catMaybes = xs =>
    Array.reduceRight(
      (acc, x) =>
        switch (x) {
        | Some(v) => [v, ...acc]
        | None => acc
        },
      [],
      xs,
    )
    |> Array.fromList;
};

module Parser = {
  /* open Option; */
  let captures = (re: Js.Re.t, x: string) : option(array(option(string))) =>
    Js.Re.exec(x, re)
    |> Option.map(result =>
         result |> Js.Re.captures |> Array.map(Js.Nullable.toOption)
       );
  type parser('a) =
    | Regex(Js.Re.t, array(option(string)) => option('a))
    | String(string => option('a));
  let parse = (parser: parser('a), raw: string) : option('a) =>
    switch (parser) {
    | Regex(re, handler) => captures(re, raw) |> Option.flatMap(handler)
    | String(handler) => handler(raw)
    };
  let parseArray = (parser: parser('a), xs: array(string)) : array('a) =>
    xs |> Array.map(raw => raw |> parse(parser)) |> Array_.catMaybes;
  let at =
      (i: int, parser: parser('a), captured: array(option(string)))
      : option('a) =>
    if (i >= Array.length(captured)) {
      None;
    } else {
      Option.flatten(captured[i]) |> Option.flatMap(parse(parser));
    };
  let choice = (res: array(parser('a))) =>
    String(
      raw =>
        Array.reduce(
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
    | [x, ...xs] => [x, ...xs |> List.flatMap(i => [sep, i])]
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
    | [_, ...xs] => last(xs)
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
