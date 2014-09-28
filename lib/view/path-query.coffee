{View, EditorView} = require 'atom'

module.exports = class PathQueryView extends View

  @activated: false

  @content: ->
    @div class: 'agda-panel tool-panel panel-bottom', =>
      @div outlet: 'header-block', class: 'inset-panel padded', =>
        @span outlet: 'header', 'Given path of Agda executable not found, try "which agda" in your terminal'
      @div outlet: 'body-block', class: "block padded", =>
        @subview 'pathEditor', new EditorView(mini: true, placeholderText: 'Please insert the path here')

  initialize: (serializeState) ->

    @registerHandlers()

    configPath = atom.config.get 'agda-mode.agdaExecutablePath'
    @validatePath configPath

  attach: (callback) ->
    atom.workspaceView.prependToBottom @

    # focus on the input box
    @pathEditor.focus()
    @one 'success', callback


  registerHandlers: ->

    ########## UI events ##########

    # confirm
    @on 'core:confirm', =>
      path = @pathEditor.getText()
      # @errorMessage.hide()
      @validatePath path

    # cancel or close
    @on 'core:cancel core:close', => @detach()



    ########## internal custom events ##########

    @on 'success', (el, path, stdout) =>
      atom.config.set 'agda-mode.agdaExecutablePath', path
      @detach()

    @on 'error', (el, error) =>

      # the path from the config is wrong, attach the view
      if not @activated
        @attach()
        @activated = true
      # the path from the input box is wrong
      else
        @header
          .text 'Given path not found! Please try again.'
          .attr 'class', 'text-error'


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
