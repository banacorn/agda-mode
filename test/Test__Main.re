// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
// open BsChai.Expect.Expect; // exports `expect`
// open BsChai.Expect.Combos;
// open BsChai.Expect;

open Test__Util;

before(Package.activate);
after(Package.deactivate);

// describe("Package", () => {
//   it(
//     "should be activated after triggering 'agda-mode:load' on .agda files", () => {
//     // before
//     expect("agda-mode")
//     |> Modifiers.not
//     |> to_be_one_of(Package.activeNames())
//     |> ignore;
//
//     File.openAsset("Temp.agda")
//     |> then_(dispatch("agda-mode:load"))
//     |> then_(_
//          // after
//          =>
//            expect("agda-mode")
//            |> to_be_one_of(Package.activeNames())
//            |> resolve
//          );
//   });
//
//   it(
//     "should be activated after triggering 'agda-mode:load' on .lagda files", () => {
//     // before
//     expect("agda-mode")
//     |> Modifiers.not
//     |> to_be_one_of(Package.activeNames())
//     |> ignore;
//
//     File.openAsset("Blank2.lagda")
//     |> then_(dispatch("agda-mode:load"))
//     |> then_(_
//          // after
//          =>
//            expect("agda-mode")
//            |> to_be_one_of(Package.activeNames())
//            |> resolve
//          );
//   });
// });

describe("Instances", () => {
  it_skip("should have no instances before opening any files", () =>
    BsMocha.Assert.equal(AgdaMode.Instances.size(), 0) |> resolve
  );

  it("should respect the number of opened .agda file", () =>
    File.openAsset("Temp.agda")
    |> then_(editor => {
         BsMocha.Assert.equal(AgdaMode.Instances.size(), 1);
         let pane = Atom.Workspace.getActivePane();
         Atom.Pane.destroyItem_(
           Atom.TextEditor.asWorkspaceItem(editor),
           true,
           pane,
         );
       })
    |> then_(destroyed => {
         BsMocha.Assert.equal(AgdaMode.Instances.size(), destroyed ? 0 : 1);
         resolve();
       })
  );

  it("should respect the number of opened .lagda file", () =>
    File.openAsset("Blank2.lagda")
    |> then_(editor => {
         BsMocha.Assert.equal(AgdaMode.Instances.size(), 1);
         let pane = Atom.Workspace.getActivePane();
         Atom.Pane.destroyItem_(
           Atom.TextEditor.asWorkspaceItem(editor),
           true,
           pane,
         );
       })
    |> then_(destroyed => {
         BsMocha.Assert.equal(AgdaMode.Instances.size(), destroyed ? 0 : 1);
         resolve();
       })
  );

  it("should include '.agda' in the classlist", () =>
    File.openAsset("Temp.agda")
    |> then_(editor => {
         editor
         |> Atom.Views.getView
         |> Webapi.Dom.HtmlElement.classList
         |> Webapi.Dom.DomTokenList.contains("agda")
         |> BsMocha.Assert.ok;
         resolve();
       })
  );
});
