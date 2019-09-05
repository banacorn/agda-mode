// open Rebase;
// open Fn;
// open BsChai.Expect;
open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open Test__Util;

describe_only("Input Method", () => {
  open Webapi.Dom;

  before(Package.activate);
  after(Package.deactivate);

  it(
    "should not add class '.agda-mode-input-method-activated' to the editor element before triggering",
    () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(editor => {
         let element = Atom.Views.getView(editor);

         element
         |> HtmlElement.classList
         |> DomTokenList.contains("agda-mode-input-method-activated")
         |> Assert.equal(false);

         resolve();
       })
  );

  BsMocha.Async.it(
    "should add class '.agda-mode-input-method-activated' to the editor element after triggering",
    done_ =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(editor => {
         let element = Atom.Views.getView(editor);

         // building and triggering the event
         let press = key =>
           Atom.Keymaps.buildKeydownEvent_(
             key,
             {
               "ctrl": false,
               "alt": false,
               "shift": false,
               "cmd": false,
               "which": 0,
               "target": element,
             },
           );
         Atom.Keymaps.handleKeyboardEvent(press("\\"));

         Js.Global.setTimeout(
           () => {
             element
             |> HtmlElement.classList
             |> DomTokenList.contains("agda-mode-input-method-activated")
             |> Js.log;
             done_();
           },
           1000,
         )
         |> ignore;
         resolve();
       })
    |> ignore
  );
});

// open Rebase;
// open! BsMocha;
// open! BsMocha.Mocha;
// open! BsMocha.Promise;
// open Js.Promise;
// // open BsChai.Expect.Expect; // exports `expect`
// // open BsChai.Expect.Combos;
//
// open Test__Util;
// describe("Input Method", () => {
//   // let size = dict => dict^ |> Js.Dict.keys |> Array.length;
//   // let openedFiles =
//
//   // let pane = Atom.Workspace.getActivePane();
//   // Atom.Pane.destroyItem_(editor, true, pane);
//
//   let instances = ref(Js.Dict.empty());
//   before(() => {
//     instances := AgdaMode.activate();
//     resolve();
//   });
//   after(() => {
//     Atom.Workspace.getActivePane() |> Atom.Pane.destroyItems;
//     resolve();
//   });
//   it("should respect the number of opened .agda file", () =>
//     openFile(asset("Blank1.agda"))
//     |> then_(editor
//          // Atom.Packages.activatePackage("agda-mode")
//          =>
//            dispatch(editor, "agda-mode:load")
//            |> then_(() => {
//                 AgdaMode.Instances.get(editor)
//                 |> Option.forEach((instance: Instance.t) => {
//                      instance |> AgdaMode.activate |> ignore;
//                      Js.log(instance.isLoaded);
//                      Js.log(instance.isLoaded);
//                    });
//                 resolve();
//               })
//          )
//   );
//   ();
// let activationPromise = ref(None);
// let editor = ref(None);
//
// before_each(() => {
//   activationPromise := Some(Atom.Packages.activatePackage("agda-mode"));
//   resolve();
// });
//
// after(() => {
//   activationPromise := None;
//   Atom.Packages.deactivatePackage("agda-mode", false)
//   |> then_(() => closeFile(asset("Blank1.agda")));
// });
//
// // var key;
// // key = atom.keymaps.constructor.buildKeydownEvent('tab', {target: document.activeElement});
// // return atom.keymaps.handleKeyboardEvent(key);
//
// Async.it(
//   "should be activated after triggering 'agda-mode:load' on .agda files",
//   done_ =>
//   openFile(asset("Blank1.agda"))
//   |> then_(e => {
//        editor := Some(e);
//        dispatch(e, "agda-mode:load");
//      })
//   |> then_(() => activationPromise^ |> Option.getOr(resolve()))
//   |> then_(() => {
//        let target = Atom.Views.getView(editor^);
//        Webapi.Dom.HtmlElement.focus(target);
//        // listen to keydowns
//        Atom.Keymaps.onDidMatchBinding(_
//          // Js.log(target);
//          =>
//            Js.Global.setTimeout(
//              () => {
//                target |> Webapi.Dom.HtmlElement.classList |> Js.log;
//                done_();
//              },
//              5000,
//            )
//            |> ignore
//          )
//        |> ignore;
//
//        // building and triggering the event
//        let press = key =>
//          Atom.Keymaps.buildKeydownEvent_(
//            key,
//            {
//              "ctrl": false,
//              "alt": false,
//              "shift": false,
//              "cmd": false,
//              "which": 0,
//              "target": target,
//            },
//          );
//        Atom.Keymaps.handleKeyboardEvent(press("\\"));
//
//        resolve();
//      })
//   |> ignore
// );
// // |> then_(() =>
// //      expect("agda-mode")
// //      |> to_be_one_of(getActivePackageNames())
// //      |> resolve
// //    )
// //
// // |> then_(editor => {
// //      let target = Atom.Views.getView(editor);
// //      Js.log("Atom.Keymaps.getKeybindings()");
// //      Atom.Keymaps.loadKeymap("./");
// //      Js.log("Atom.Keymaps.getKeybindings()");
// //      Js.log(Atom.Keymaps.getKeybindings());
// //      Js.log("Atom.Keymaps.getKeybindings()");
// //      Atom.Keymaps.onDidMatchBinding(event => {
// //        Js.log(event);
// //        done_();
// //      });
// //      let event =
// //        Atom.Keymaps.buildKeydownEvent_(
// //          "\\",
// //          {
// //            "ctrl": false,
// //            "alt": false,
// //            "shift": false,
// //            "cmd": false,
// //            "which": 0,
// //            "target": target,
// //          },
// //        );
// //      Atom.Keymaps.handleKeyboardEvent(event);
// //      resolve();
// //    })
// // |> ignore
// });
