{WorkspaceView} = require 'atom'
AgdaMode = require '../lib/agda-mode'

# Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
#
# To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
# or `fdescribe`). Remove the `f` to unfocus the block.

describe "AgdaMode", ->
  activationPromise = null

  beforeEach ->
    atom.workspaceView = new WorkspaceView
    activationPromise = atom.packages.activatePackage('agda-mode')

  describe "when the agda-mode:toggle event is triggered", ->
    it "attaches and then detaches the view", ->
      expect(atom.workspaceView.find('.agda-mode')).not.toExist()

      # This is an activation event, triggering it will cause the package to be
      # activated.
      atom.workspaceView.trigger 'agda-mode:toggle'

      waitsForPromise ->
        activationPromise

      runs ->
        expect(atom.workspaceView.find('.agda-mode')).toExist()
        atom.workspaceView.trigger 'agda-mode:toggle'
        expect(atom.workspaceView.find('.agda-mode')).not.toExist()
