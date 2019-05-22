/* Parsing S-Expressions */
/* Courtesy of @NightRa */
module SExpression = {
  type t =
    | A(string)
    | L(array(t));

  let rec toString =
    fun
    | A(s) => "\"" ++ s ++ "\""
    | L(xs) =>
      "[" ++ (Array.map(toString, xs) |> Js.Array.joinWith(", ")) ++ "]";
};
