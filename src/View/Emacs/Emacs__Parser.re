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
        "/^(?:(?:[^\\(\\{\\s]+\\s+\\:=?)|Have\\:|Goal\\:)\\s* \\S*/"
      ];
      /* case when the term's name is too long, the rest of the judgement
            would go to the next line, e.g:
                 banananananananananananananananana
                     : Banana
         */
      let reallyLongTermIdentifier = [%re "/^\\S+$/"];
      let restOfTheJudgement = [%re "/^\\s*\\:=?\\s* \\S*/"];
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
