open Rebase;
open Fn;

open BsChai.Expect;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;

open Test__Util;

open Webapi.Dom;

describe("View", () => {
  describe("when activating agda-mode", () => {
    after_each(Package.cleanup);

    it("should mount `article.agda-mode-panel-container` at the bottom", () =>
      openAndLoad("Blank1.agda")
      |> then_(_ => {
           let children =
             Atom.Workspace.getBottomPanels()
             |> Array.flatMap(
                  Atom.Views.getView
                  >> HtmlElement.childNodes
                  >> NodeList.toArray,
                )
             |> Array.filterMap(Element.ofNode);

           // we've activated a panel with the class name ".agda-mode-panel-container"
           Expect.expect(children |> Array.map(Element.className))
           |> Combos.End.to_include("agda-mode-panel-container");
           resolve();
         })
    );

    it(
      "should mount `section#agda-mode:xxx` inside `article.agda-mode-panel-container`",
      () =>
      openAndLoad("Blank1.agda")
      |> then_(instance => {
           let panels =
             Atom.Workspace.getBottomPanels()
             |> Array.flatMap(
                  Atom.Views.getView
                  >> HtmlElement.childNodes
                  >> NodeList.toArray,
                )
             |> Array.filterMap(Element.ofNode)
             |> Array.filter(elem =>
                  elem |> Element.className == "agda-mode-panel-container"
                );
           let targetID = "agda-mode:" ++ Instance.getID(instance);

           panels
           |> Array.flatMap(Element.childNodes >> NodeList.toArray)
           |> Array.filterMap(Element.ofNode)
           |> Array.map(Element.id)
           |> Js.Array.includes(targetID)
           |> BsMocha.Assert.ok;

           resolve();
         })
    );
  });

  describe("when toggle docking", () => {
    after_each(Package.cleanup);

    it("should open a new tab", () =>
      openAndLoad("Blank1.agda")
      |> then_(_ => {
           let children =
             Atom.Workspace.getBottomPanels()
             |> Array.flatMap(
                  Atom.Views.getView
                  >> HtmlElement.childNodes
                  >> NodeList.toArray,
                )
             |> Array.filterMap(Element.ofNode);

           // we've activated a panel with the class name ".agda-mode-panel-container"
           Expect.expect(children |> Array.map(Element.className))
           |> Combos.End.to_include("agda-mode-panel-container");
           resolve();
         })
    );
  });
});
