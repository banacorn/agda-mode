open! Rebase;

open Instance__Type;
open Task;

let handle =
  fun
  | ParseError(errors) => [
      WithConnection(
        conn => {
          // log the errors
          errors |> Array.forEach(e => Log.logError(e, conn.Connection.log));
          // and display with the log
          return([
            Display(
              "Parse Error",
              Type.View.Header.Error,
              Emacs(ParseError(conn)),
            ),
          ]);
        },
      ),
      WithInstance(
        instance => {
          Editors.Focus.on(Editors.Source, instance.editors);
          return([]);
        },
      ),
    ]

  | ConnectionError(error) => {
      let (header, body) = Connection.Error.toString(error);
      [
        Display(
          "Connection-related Error: " ++ header,
          Type.View.Header.Error,
          Emacs(PlainText(body)),
        ),
        WithInstance(
          instance => {
            Editors.Focus.on(Editors.Source, instance.editors);
            return([]);
          },
        ),
      ];
    }
  | Cancelled => [
      Display(
        "Query Cancelled",
        Type.View.Header.Error,
        Emacs(PlainText("")),
      ),
      WithInstance(
        instance => {
          Editors.Focus.on(Editors.Source, instance.editors);
          return([]);
        },
      ),
    ]
  | GoalNotIndexed => [
      Display(
        "Goal not indexed",
        Type.View.Header.Error,
        Emacs(PlainText("Please reload to re-index the goal")),
      ),
      WithInstance(
        instance => {
          Editors.Focus.on(Editors.Source, instance.editors);
          return([]);
        },
      ),
    ]
  | OutOfGoal => [
      Display(
        "Out of goal",
        Type.View.Header.Error,
        Emacs(PlainText("Please place the cursor in a goal")),
      ),
      WithInstance(
        instance => {
          Editors.Focus.on(Editors.Source, instance.editors);
          return([]);
        },
      ),
    ];
