open ReasonReact;

let sepBy = (sep: reactElement, item: list(reactElement)) =>
  switch (item) {
  | [] => <> </>
  | [x] => x
  | [x, ...xs] =>
    <> x (array(Array.of_list(List.map(i => <> sep i </>, xs)))) </>
  };
