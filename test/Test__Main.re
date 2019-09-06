open Rebase;
open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open BsChai.Expect.Expect; // exports `expect`
open BsChai.Expect.Combos;
open BsChai.Expect;

open Test__Util;

describe("Package", () => {
  before_each(Package.activate);
  after_each(Package.deactivate);

  after(Package.deactivate);

  it(
    "should be activated after triggering 'agda-mode:load' on .agda files", () => {
    // before
    expect("agda-mode")
    |> Modifiers.not
    |> to_be_one_of(Package.activeNames())
    |> ignore;

    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(_
         // after
         =>
           expect("agda-mode")
           |> to_be_one_of(Package.activeNames())
           |> resolve
         );
  });

  it(
    "should be activated after triggering 'agda-mode:load' on .lagda files", () => {
    // before
    expect("agda-mode")
    |> Modifiers.not
    |> to_be_one_of(Package.activeNames())
    |> ignore;

    File.openAsset("Blank2.lagda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(_
         // after
         =>
           expect("agda-mode")
           |> to_be_one_of(Package.activeNames())
           |> resolve
         );
  });
});

describe("Instances", () => {
  let instances = ref(Js.Dict.empty());
  let size = dict => dict^ |> Js.Dict.keys |> Array.length;

  it("should have no instances before opening any files", () => {
    instances := AgdaMode.activate();
    Assert.equal(size(instances), 0) |> resolve;
  });

  it("should respect the number of opened .agda file", () =>
    File.openAsset("Blank1.agda")
    |> then_(editor => {
         Assert.equal(size(instances), 1);
         let pane = Atom.Workspace.getActivePane();
         Atom.Pane.destroyItem_(
           Atom.TextEditor.asWorkspaceItem(editor),
           true,
           pane,
         );
       })
    |> then_(destroyed => {
         Assert.equal(size(instances), destroyed ? 0 : 1);
         resolve();
       })
  );

  it("should respect the number of opened .lagda file", () =>
    File.openAsset("Blank2.lagda")
    |> then_(editor => {
         Assert.equal(size(instances), 1);
         let pane = Atom.Workspace.getActivePane();
         Atom.Pane.destroyItem_(
           Atom.TextEditor.asWorkspaceItem(editor),
           true,
           pane,
         );
       })
    |> then_(destroyed => {
         Assert.equal(size(instances), destroyed ? 0 : 1);
         resolve();
       })
  );

  it("should include '.agda' in the classlist", () =>
    File.openAsset("Blank1.agda")
    |> then_(editor => {
         editor
         |> Atom.Views.getView
         |> Webapi.Dom.HtmlElement.classList
         |> Webapi.Dom.DomTokenList.contains("agda")
         |> Assert.ok;
         resolve();
       })
  );
});
