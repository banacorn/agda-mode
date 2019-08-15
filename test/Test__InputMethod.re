open Rebase;
open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open BsChai.Expect.Expect; // exports `expect`
open BsChai.Expect.Combos;

open Test__Util;

describe("Input Method", () => {
  let activationPromise = ref(None);

  before_each(() => {
    activationPromise := Some(Atom.Packages.activatePackage("agda-mode"));
    resolve();
  });

  after(() => {
    activationPromise := None;
    Atom.Packages.deactivatePackage("agda-mode", false);
    closeFile(asset("Blank1.agda"));
  });

  // var key;
  // key = atom.keymaps.constructor.buildKeydownEvent('tab', {target: document.activeElement});
  // return atom.keymaps.handleKeyboardEvent(key);

  Async.it(
    "should be activated after triggering 'agda-mode:load' on .agda files",
    done_ =>
    openFile(asset("Blank1.agda"))
    |> then_(editor => {
         let target = Atom.Views.getView(editor);
         // editor |> Atom.TextEditor.insertText("a");
         // Js.log(
         //   "laoding " ++ Node.Path.join2(base, "keymaps/agda-mode.cson"),
         // );
         // Atom.Keymaps.loadKeymap(
         //   Node.Path.join2(base, "keymaps/agda-mode.cson"),
         // );
         // Atom.Keymaps.onDidMatchBinding(event => {
         //   Js.log(event);
         //   done_();
         // });
         // let event =
         //   Atom.Keymaps.buildKeydownEvent_(
         //     "\\",
         //     {
         //       "ctrl": false,
         //       "alt": false,
         //       "shift": false,
         //       "cmd": false,
         //       "which": 0,
         //       "target": target,
         //     },
         //   );
         // Atom.Keymaps.handleKeyboardEvent(event);
         let keyBindings = Atom.Keymaps.getKeyBindings();
         let p: Atom__Type.KeyBinding.t => bool = [%raw
           b => "{return b.command.startsWith('agda')}"
         ];
         let p2: Atom__Type.KeyBinding.t => bool = [%raw
           b => "{return (b.command.startsWith('agda') && b.keystrokes.startsWith('\\\\'))}"
         ];

         keyBindings |> Array.filter(p2) |> Js.log;
         done_();
         resolve();
       })
    |> ignore
  );
  // |> then_(() =>
  //      expect("agda-mode")
  //      |> to_be_one_of(getActivePackageNames())
  //      |> resolve
  //    )
  //
  // |> then_(editor => {
  //      let target = Atom.Views.getView(editor);
  //      Js.log("Atom.Keymaps.getKeybindings()");
  //      Atom.Keymaps.loadKeymap("./");
  //      Js.log("Atom.Keymaps.getKeybindings()");
  //      Js.log(Atom.Keymaps.getKeybindings());
  //      Js.log("Atom.Keymaps.getKeybindings()");
  //      Atom.Keymaps.onDidMatchBinding(event => {
  //        Js.log(event);
  //        done_();
  //      });
  //      let event =
  //        Atom.Keymaps.buildKeydownEvent_(
  //          "\\",
  //          {
  //            "ctrl": false,
  //            "alt": false,
  //            "shift": false,
  //            "cmd": false,
  //            "which": 0,
  //            "target": target,
  //          },
  //        );
  //      Atom.Keymaps.handleKeyboardEvent(event);
  //      resolve();
  //    })
  // |> ignore
});
