{View, EditorView} = require 'atom'


module.exports = class AgdaPanelView extends View
  @path: null

  @content: ->
    @div class: 'tool-panel panel-bottom padded', =>
      @div class: "block", =>
        @label 'Full path of Agda executable, try "which agda" in your terminal'
        @subview 'pathEditor', new EditorView(mini: true, placeholderText: 'Please insert the path here')
      @div class: "block", =>
        @button outlet: 'pathButton', class: 'btn', 'Enter'
        @span outlet: 'errorMessage', class: 'inline-block highlight-error', 'Error: command not found'
        @span outlet: 'successMessage', class: 'inline-block text-success'

  initialize: (serializeState) ->
    atom.workspaceView.prependToBottom(this)
  #
  #   # focus the input box
  #   @pathEditor.focus()
  #
  #   @eventHandlers()
  #   @successMessage.hide()
  #   @errorMessage.hide()
  #
  # eventHandlers: ->
  #
  #   # confirm
  #   @on 'core:confirm', => @confirm()     # key
  #   @pathButton.click => @confirm()       # button
  #
  #   # cancel or close
  #   @on 'core:cancel core:close', => @destroy()
  #
  #
  # confirm: ->
  #   path = @pathEditor.getText()
  #   @validatePath path
  #
  # # locate the path and see if it is Agda executable
  # validatePath: (path) ->
  #   path = path.replace('\n', '')
  #   {exec} = require 'child_process'
  #   command = path + ' -V'
  #   exec command, (error, stdout, stderr) =>
  #     if error
  #       @error()
  #     else if stderr
  #       @error()
  #     else
  #       if /^Agda version/.test stdout
  #         @success stdout
  #         @path = path
  #       else
  #         @error()
  #
  #
  # error: ->
  #   @errorMessage.show()
  #   @successMessage.hide()
  #
  # success: (stdout) ->
  #
  #   @errorMessage.hide()
  #   @successMessage.show().text('Success: ' + stdout)

    # atom.workspaceView.statusBar?.appendLeft('<span>Success: ' + stdout+ '</span>')


  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()
