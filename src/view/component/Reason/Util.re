open ReasonReact;

let sepBy_ = (sep: 'a, item: list('a)) : list('a) =>
  switch (item) {
  | [] => []
  | [x, ...xs] => [x, ...xs |> List.map(i => [sep, i]) |> List.concat]
  };

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
