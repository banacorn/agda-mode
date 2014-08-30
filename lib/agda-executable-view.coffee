{View, EditorView} = require 'atom'


module.exports = class AgdaExecutableView extends View
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
  @errorMessageView: ->


  initialize: (serializeState) ->
    atom.workspaceView.prependToBottom(this)

    # focus the input box
    @pathEditor.focus()

    @eventHandlers()
    @successMessage.hide()
    @errorMessage.hide()
  eventHandlers: ->

    # confirm
    @on 'core:confirm', => @confirm()     # key
    @pathButton.click => @confirm()       # button

    # cancel or close
    @on 'core:cancel core:close', => @destroy()


  confirm: ->
    path = @pathEditor.getText()
    @locateExecutable path

  # locate the path and see if it is Agda executable
  locateExecutable: (path) ->
    path = path.replace('\n', '')
    {exec} = require 'child_process'
    command = path + ' -V'
    exec command, (error, stdout, stderr) =>
      if error
        @error()
      else if stderr
        @error()
      else
        if /^Agda version/.test stdout
          @success stdout
          @path = path
        else
          @error()


  error: ->
    @errorMessage.show()
    @pathEditor.select()

  success: (stdout)->
    @successMessage.show().text('Success: ' + stdout)

  # Returns an object tsdhat can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()
