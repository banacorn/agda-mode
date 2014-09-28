{View, EditorView} = require 'atom'

module.exports = class PathQueryView extends View

  @viewActivated: false

  @content: ->
    @div class: 'tool-panel panel-bottom padded', =>
      @div class: "block", =>
        @label 'Given path of Agda executable not found, try "which agda" in your terminal'
        @subview 'pathEditor', new EditorView(mini: true, placeholderText: 'Please insert the path here')
      @div class: "block", =>
        @button outlet: 'pathButton', class: 'btn', 'Enter'
        @span outlet: 'errorMessage', class: 'inline-block text-error', 'Error: command not found'

  initialize: (serializeState) ->

    @registerHandlers()

    configPath = atom.config.get 'agda-mode.agdaExecutablePath'
    @validatePath configPath

  query: (callback) ->

    atom.workspaceView.prependToBottom(this)

    # focus on the input box
    @pathEditor.focus()
    @errorMessage.hide()

    @one 'success', callback


  registerHandlers: ->

    ########## UI events ##########

    # confirm
    @on 'core:confirm', => @onConfirm()     # key
    @pathButton.click => @onConfirm()       # button

    # cancel or close
    @on 'core:cancel core:close', => @destroy()



    ########## custom events ##########

    @on 'success', (el, path, stdout) =>
      atom.config.set 'agda-mode.agdaExecutablePath', path
      @detach()

    @on 'error', (el, error) =>

      # the path from the config is wrong
      if not @viewActivated
        @query()
        @viewActivated = true

      # the path from the input box is wrong
      else
        @errorMessage.show()



  onConfirm: ->
    path = @pathEditor.getText()
    @errorMessage.hide()
    @validatePath path

  # locate the path and see if it is Agda executable
  validatePath: (path) ->
    path = path.replace('\n', '')
    {exec} = require 'child_process'
    command = path + ' -V'
    exec command, (error, stdout, stderr) =>
      if error
        @trigger 'error', error
      else if stderr
        @trigger 'error', stderr
      else
        if /^Agda version/.test stdout
          @trigger 'success', path, stdout
        else
          @trigger 'error'

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()
