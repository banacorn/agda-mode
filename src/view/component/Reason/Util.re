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
