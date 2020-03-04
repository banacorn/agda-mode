type t =
  | WithInstance(
      Instance.t => Promise.t(Rebase.result(list(t), Instance__Type.error)),
    )
  | DispatchCommand(Command.t)
  | SendRequest(Request.t);
