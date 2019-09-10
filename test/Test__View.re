open Rebase;
open Fn;

open BsChai.Expect;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;

open Test__Util;

describe("View", () => {
  before_each(Package.deactivate >> then_(Package.activate));
  describe("when activating agda-mode", () =>
    it("should mount the panel at the bottom", () =>
      File.openAsset("Blank1.agda")
      |> then_(dispatch("agda-mode:load"))
      |> then_(getInstance)
      |> then_((instance: Instance.t) => instance.onDispatch |> Event.once)
      |> then_(_ => {
           open Webapi.Dom;
           let children =
             Atom.Workspace.getBottomPanels()
             |> Array.flatMap(
                  Atom.Views.getView
                  >> HtmlElement.childNodes
                  >> NodeList.toArray,
                )
             |> Array.filterMap(Element.ofNode);

           // we've activated a panel with the class name ".agda-mode"
           Expect.expect(children |> Array.map(Element.className))
           |> Combos.End.to_include("agda-mode");
           resolve();
         })
    )
  );
});
