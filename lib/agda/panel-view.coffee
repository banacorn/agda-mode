{View} = require 'atom'


module.exports = class AgdaPanelView extends View

  @content: ->
    @div class: 'tool-panel panel-bottom padded', =>
      @div class: "block", =>
        @span outlet: 'info', class: 'inline-block'
      @div class: "block", =>
        @span outlet: 'status', class: 'inline-block'

  initialize: (serializeState) ->
    @registerHandlers()

  attach: ->
    atom.workspaceView.prependToBottom @



  registerHandlers: ->
    # ########## UI events ##########
    #
    # # confirm
    # @on 'core:confirm', => @onConfirm()     # key
    # @pathButton.click => @onConfirm()       # button
    #
    # # cancel or close
    # @on 'core:cancel core:close', => @destroy()
    #
    #
    #
    # ########## custom events ##########
    #
    # @on 'agda-path-query-view.success', (el, path, stdout) =>
    #   atom.config.set 'agda-mode.agdaExecutablePath', path
    #   @detach()
    #
    # @on 'agda-path-query-view.error', (el, error) =>
    #
    #   # the path from the config is wrong
    #   if not @viewActivated
    #     @query()
    #     @viewActivated = true
    #
    #   # the path from the input box is wrong
    #   else
    #     @errorMessage.show()



  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()
