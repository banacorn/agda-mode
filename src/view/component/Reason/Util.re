open ReasonReact;

let sepBy_ = (sep: 'a, item: list('a)) =>
  switch (item) {
  | [] => []
  | [x, ...xs] => [x, ...xs |> List.map(i => [sep, i]) |> List.concat]
  };

let sepBy = (sep: reactElement, item: list(reactElement)) =>
  switch (item) {
  | [] => <> </>
  | [x] => x
  | [x, ...xs] =>
    <> x (array(Array.of_list(List.map(i => <> sep i </>, xs)))) </>
  };

let contains =
  fun%raw (haystack, needle) => "haystack.indexOf(needle) !== -1";

let enclosedBy = (front: reactElement, back: reactElement, item: reactElement) =>
  <> front (string(" ")) item (string(" ")) back </>;
