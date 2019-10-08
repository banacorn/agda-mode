// open Rebase;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open! Test__Util;

describe_only("Connection", () =>
  describe("Path", () => {
    after_each(Package.after_each);
    it(
      "should success when trying to search for the path of program called 'agda'",
      () => {
      Atom.Config.set("agda-mode.agdaName", "agda") |> ignore;
      openAndLoad("Temp.agda")
      |> then_(_ => {
           Assert.ok();
           resolve();
         });
    });
    it(
      "should fail when trying to search for the path of program called 'non-agda'",
      () => {
      Atom.Config.set("agda-mode.agdaName", "non-agda") |> ignore;
      File.openAsset("Temp.agda")
      |> then_(getInstance)
      |> then_(instance => {
           let onConnectionError =
             instance.Instance__Type.onConnectionError |> Event.once;

           dispatch("agda-mode:load", instance)
           |> then_(_ => {
                Assert.fail("should fail on connection");
                resolve();
              })
           |> ignore;

           onConnectionError
           |> Async.toPromise
           |> then_(error => {
                open Connection.Error;
                switch (error) {
                | AutoSearchError(NotFound("non-agda", _)) => Assert.ok()
                | _ => Assert.fail("wrong connection error")
                };
                resolve();
              });
         });
    });
  })
);
