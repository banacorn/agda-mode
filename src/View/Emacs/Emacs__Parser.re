open Rebase;

open Rebase.Option;

/* open Type.View.Emacs; */

let unindent: array(string) => array(string) =
  lines => {
    let isNewline = (line, nextLine) => {
      let sort = [%re "/^Sort \\S*/"];
      let delimeter = [%re "/^\\u2014{4}/g"];
      /* banana : Banana */
      let completeJudgement = [%re
        "/^(?:(?:[^\\(\\{\\s]+\\s+\\:)|Have\\:|Goal\\:)\\s* \\S*/"
      ];
      /* case when the term's name is too long, the rest of the judgement
            would go to the next line, e.g:
                 banananananananananananananananana
                     : Banana
         */
      let reallyLongTermIdentifier = [%re "/^\\S+$/"];
      let restOfTheJudgement = [%re "/^\\s*\\:\\s* \\S*/"];
      Js.Re.test_(sort, line)
      || Js.Re.test_(delimeter, line)
      || Js.Re.test_(reallyLongTermIdentifier, line)
      && nextLine
      |> exists(line => Js.Re.test_(restOfTheJudgement, line))
      || Js.Re.test_(completeJudgement, line);
    };
    let newLineIndices: array(int) =
      lines
      |> Array.mapi((line, index) => (line, lines[index + 1], index))
      |> Array.filter(((line, nextLine, _)) => isNewline(line, nextLine))
      |> Array.map(((_, _, index)) => index);
    newLineIndices
    |> Array.mapi((index, i) =>
         switch (newLineIndices[i + 1]) {
         | None => (index, Array.length(lines) + 1)
         | Some(n) => (index, n)
         }
       )
    |> Array.map(((from, to_)) =>
         lines
         |> Array.slice(~from, ~to_)
         |> List.fromArray
         |> String.joinWith("\n")
       );
  };

let partiteMetas =
  Util.Dict.split("metas", (rawMetas: array(string)) => {
    let metas = unindent(rawMetas);
    let indexOfHiddenMetas =
      metas
      |> Array.findIndex(s =>
           s |> Emacs__Component.Output.parseOutputWithRange |> isSome
         )
      |> map(fst);
    metas
    |> Util.Dict.partite(((_, i)) =>
         switch (indexOfHiddenMetas) {
         | Some(n) =>
           if (i === n) {
             Some("hiddenMetas");
           } else if (i === 0) {
             Some("interactionMetas");
           } else {
             None;
           }
         | None =>
           /* All interaction metas */
           if (i === 0) {
             Some("interactionMetas");
           } else {
             None;
           }
         }
       );
  });

let partiteWarningsOrErrors = key =>
  Util.Dict.update(
    key,
    (raw: array(string)) => {
      let hasDelimeter =
        raw[0] |> flatMap(Js.String.match([%re "/^\\u2014{4}/"])) |> isSome;
      let lines = hasDelimeter ? raw |> Js.Array.sliceFrom(1) : raw;
      let markWarningStart = line =>
        line |> Type.Location.Range.parse |> isSome;
      /* If the previous warning of error ends with "at", then we have to glue it back */
      let glueBack = xs =>
        xs[Array.length(xs) - 1]
        |> flatMap(Js.String.match([%re "/at$/"]))
        |> isSome;
      lines
      |> Util.Array_.partite(markWarningStart)
      |> Util.Array_.mergeWithNext(glueBack)
      |> Array.map(xs => xs |> List.fromArray |> String.joinWith("\n"));
    },
  );

/* Parsing S-Expressions */
/* Courtesy of @NightRa */
module SExpression = {
  type t =
    | A(string)
    | L(array(t));

  let preprocess = (string: string): result(string, string) => {
    /* Replace window's \\ in paths with /, so that \n doesn't get treated as newline. */
    let result =
      ref(string |> Js.String.replaceByRe([%re "/\\\\\\\\/g"], "/"));

    /* handles Agda parse error */
    if (result^ |> Js.String.substring(~from=0, ~to_=13) === "cannot read: ") {
      Error(Js.String.sliceToEnd(~from=12, result^));
    } else if
      /* drop priority prefixes like ((last . 1)) as they are all constants with respect to responses

         the following text from agda-mode.el explains what are those
         "last . n" prefixes for:
             Every command is run by this function, unless it has the form
             "(('last . priority) . cmd)", in which case it is run by
             `agda2-run-last-commands' at the end, after the Agda2 prompt
             has reappeared, after all non-last commands, and after all
             interactive highlighting is complete. The last commands can have
             different integer priorities; those with the lowest priority are
             executed first. */
      (result^ |> String.startsWith("((last")) {
      let index = result^ |> Js.String.indexOf("(agda");
      Ok(
        result^
        |> Js.String.substring(~from=index, ~to_=String.length(string) - 1),
      );
    } else {
      Ok(result^);
    };
  };

  let rec toString =
    fun
    | A(s) => "\"" ++ s ++ "\""
    | L(xs) =>
      "[" ++ (Array.map(toString, xs) |> Js.Array.joinWith(", ")) ++ "]";

  let rec flatten: t => array(string) =
    fun
    | A(s) => [|s|]
    | L(xs) => xs |> Array.flatMap(flatten);

  let postprocess = (string: string): result(t, string) => {
    let stack: array(ref(t)) = [|ref(L([||]))|];
    let word = ref("");
    let escaped = ref(false);
    let in_str = ref(false);

    let pushToTheTop = (elem: t) => {
      let index = Array.length(stack) - 1;

      switch (stack[index]) {
      | Some(expr) =>
        switch (expr^) {
        | A(_) => expr := L([|expr^, elem|])
        | L(xs) => xs |> Js.Array.push(elem) |> ignore
        }
      | None => ()
      };
    };
    /* iterates through the string */
    let totalLength = String.length(string);

    for (i in 0 to totalLength - 1) {
      let char = string |> Js.String.charAt(i);

      if (escaped^) {
        /* something was being escaped */
        /* put the backslash \ back in */
        if (char == "n") {
          word := word^ ++ "\\";
        };
        word := word^ ++ char;
        escaped := false;
      } else if (char == "\'" && ! in_str^) {
        ();
          /* drop all single quotes: 'param => param */
      } else if (char == "(" && ! in_str^) {
        stack |> Js.Array.push(ref(L([||]))) |> ignore;
      } else if (char == ")" && ! in_str^) {
        if (word^ != "") {
          pushToTheTop(A(word^));
          word := "";
        };
        switch (stack |> Js.Array.pop) {
        | Some(expr) => pushToTheTop(expr^)
        | None => ()
        };
      } else if (char == " " && ! in_str^) {
        if (word^ != "") {
          pushToTheTop(A(word^));
          word := "";
        };
      } else if (char == "\"") {
        in_str := ! in_str^;
      } else if (char == "\\" && in_str^) {
        /* something is being escaped */
        escaped := true;
      } else {
        word := word^ ++ char;
      };
    };
    switch (stack[0]) {
    | None => Error(string)
    | Some(v) =>
      switch (v^) {
      | L(xs) =>
        switch (xs[0]) {
        | None => Error(string)
        | Some(w) => Ok(w)
        }
      | _ => Error(string)
      }
    };
  };

  let parse = (string: string): result(t, string) => {
    string |> preprocess |> Result.flatMap(postprocess);
  };

  let parseFile = (content: string): array(result(t, string)) => {
    content
    |> Util.safeSplitByRe([%re "/\\r\\n|\\n/"])
    |> Array.map(result =>
         switch (result) {
         | None => None
         | Some("") => None
         | Some(chunk) => Some(chunk)
         }
       )
    |> Array.filterMap(x => x)
    |> Array.map(line => line |> Js.String.trim |> parse);
  };
};
