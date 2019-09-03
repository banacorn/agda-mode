open Rebase;
open! BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
// open BsChai.Expect.Expect; // exports `expect`
// open BsChai.Expect.Combos;

open Test__Util;

let queryMochaContent = () =>
  Webapi.Dom.document
  |> Webapi.Dom.Document.documentElement
  |> Webapi.Dom.Element.querySelector("#mocha-content");

let createMochaContent = () => {
  open Webapi.Dom;

  // create `mochaElement`
  let mochaElement = document |> Document.createElement("div");
  Element.setId(mochaElement, "mocha-content");
  // attach `mochaElement` to DOM
  document
  |> Document.asHtmlDocument
  |> Option.flatMap(HtmlDocument.body)
  |> Option.forEach(body =>
       mochaElement
       |> Element.asHtmlElement
       |> Option.forEach(el => Element.appendChild(el, body))
     );

  resolve();
};

// attach the given element to #mocha-content
let attachToDOM = (htmlElement: Webapi.Dom.HtmlElement.t_htmlElement) => {
  open Webapi.Dom;
  let mochaElement = queryMochaContent();

  let alreadyAttached =
    mochaElement
    |> Option.map(Element.contains(htmlElement))
    |> Option.getOr(true);
  ();

  // attach the `htmlElement` to `mochaElement`
  if (!alreadyAttached) {
    mochaElement
    |> Option.forEach(element => Element.appendChild(htmlElement, element));
  };

  resolve();
};

describe_skip("View", () => {
  before(createMochaContent);

  let activationPromise = ref(None);

  before_each(() =>
    attachToDOM(Atom.Views.getView(Atom.workspace))
    |> then_(_ => {
         activationPromise :=
           Some(Atom.Packages.activatePackage("agda-mode"));
         resolve();
       })
  );

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
                open Webapi.Dom;
                // Js.log(element |> Element.classList);
                // element
                // |> Element.querySelector(".agda-header-container")
                // |> Js.log;
                // element |> Element.parentElement |> Js.log;
                BsMocha.Assert.ok(true);
                resolve();
              };
              // attachToDOM(Atom.Views.getView(editor))
              // |> then_(_ => {
              //      open Webapi.Dom;
              //      // Webapi.Dom.document
              //      // |> Webapi.Dom.Document.documentElement
              //      // |> Webapi.Dom.Element.querySelector("#mocha-content")
              //      // |> Js.log;
              //      document
              //      |> Document.documentElement
              //      |> Element.querySelector("atom-panel-container")
              //      |> Option.map(Element.childElementCount)
              //      |> Js.log;
              //      resolve();
              //    });
            })
       )
  );
});
