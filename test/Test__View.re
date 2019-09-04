open Rebase;
open! BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
// open BsChai.Expect.Expect; // exports `expect`
// open BsChai.Expect.Combos;

open Test__Util;

describe_skip("View", () => {
  let activationPromise = ref(None);

  before_each(() => {
    activationPromise := Some(Atom.Packages.activatePackage("agda-mode"));
    resolve();
  });

  after_each(() => {
    activationPromise := None;
    Atom.Packages.deactivatePackage("agda-mode", false);
  });

  it("should activate the panel", () =>
    openFile(asset("Blank1.agda"))
    |> then_(editor =>
         dispatch(editor, "agda-mode:load")
         |> then_(() => activationPromise^ |> Option.getOr(resolve()))
         |> then_(() =>
              AgdaMode.Instances.get(editor)
              |> Option.map((instance: Instance.t) => {
                   let handles = instance.view.handles;
                   handles.onActivatePanel |> Event.once;
                 })
              |> Option.getOr(resolve(Error()))
            )
         |> then_(element => {
              AgdaMode.Instances.get(editor)
              |> Option.map((instance: Instance.t) =>
                   BsMocha.Assert.equal(instance.isLoaded, true)
                 )
              |> ignore;

              switch (element) {
              | Error(_) =>
                BsMocha.Assert.fail("failed to activate the panel");
                resolve();
              | Ok(element) =>
                Js.log(element);
                BsMocha.Assert.ok(true);
                resolve();
              };
            })
       )
  );
});
