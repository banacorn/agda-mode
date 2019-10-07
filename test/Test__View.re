open Rebase;
open Fn;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;

open Webapi.Dom;
open! Test__Util;

describe("View", () => {
  describe("Activation/deactivation", () => {
    describe("when activating agda-mode", () => {
      after_each(Package.after_each);

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
             children
             |> Array.map(Element.className)
             |> Js.Array.includes("agda-mode-panel-container")
             |> Assert.yes;
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
             |> Assert.yes;

             resolve();
           })
      );
    });

    describe("when closing the editor", () => {
      after_each(Package.after_each);

      it(
        "should unmount `section#agda-mode:xxx` from `article.agda-mode-panel-container` when docker at bottom",
        () =>
        openAndLoad("Temp.agda")
        |> then_(close)
        |> then_(() => {
             View.getPanelContainers()
             |> Array.flatMap(View.childHtmlElements)
             |> Array.length
             |> Assert.equal(0);
             resolve();
           })
      );

      it("should close the tab when docked at pane", () =>
        openAndLoad("Temp.agda")
        |> then_(dispatch("agda-mode:toggle-docking"))
        |> then_(close)
        |> then_(() => {
             View.getPanelContainers()
             |> Array.flatMap(View.childHtmlElements)
             |> Array.length
             |> Assert.equal(0);
             resolve();
           })
      );
    });
  });

  describe("Docking", () => {
    describe("when toggle docking", () => {
      after_each(Package.after_each);

      it("should open a new tab", () =>
        openAndLoad("Blank1.agda")
        |> then_(dispatch("agda-mode:toggle-docking"))
        |> then_(_ => {
             View.getPanelContainersAtPanes()
             |> Array.map(HtmlElement.className)
             |> Js.Array.includes("agda-mode-panel-container")
             |> Assert.yes;
             resolve();
           })
      );
    });

    describe("when toggle docking again", () => {
      after_each(Package.after_each);

      it("should close the opened tab", () =>
        openAndLoad("Blank1.agda")
        |> then_(dispatch("agda-mode:toggle-docking"))
        |> then_(dispatch("agda-mode:toggle-docking"))
        |> then_(_ => {
             View.getPanelContainersAtPanes()
             |> Array.map(HtmlElement.className)
             |> Js.Array.includes("agda-mode-panel-container")
             |> Assert.no;
             resolve();
           })
      );

      it(
        "should dock the panel back to the existing bottom panel container", () =>
        openAndLoad("Blank1.agda")
        |> then_(dispatch("agda-mode:toggle-docking"))
        |> then_(dispatch("agda-mode:toggle-docking"))
        |> then_(_ => {
             View.getPanelContainersAtBottom()
             |> Array.length
             |> Assert.equal(1);
             resolve();
           })
      );
    });
  });
});
