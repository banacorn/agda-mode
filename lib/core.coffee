_ = require 'lodash'
{log, warn, error} = require './logger'
{Range, CompositeDisposable} = require 'atom'

# Components
Commander   = require './commander'
Executable  = require './executable'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'
Highlight   = require './highlight'
Handler     = require './handler'
Panel       = require './panel'

class Core
    constructor: (@editor) ->

        # helper methods on @editor
        @editor.fromIndex = (ind) => @editor.getBuffer().positionForCharacterIndex ind
        @editor.toIndex   = (pos) => @editor.getBuffer().characterIndexForPosition pos
        @editor.translate = (pos, n) => @editor.fromIndex((@editor.toIndex pos) + n)
        @editor.fromCIRange = (range) =>
            start = @editor.fromIndex range.start
            end   = @editor.fromIndex range.end
            new Range start, end


        # initialize all components
        @disposables    = new CompositeDisposable
        @panel          = new Panel         @
        @executable     = new Executable    @
        @textBuffer     = new TextBuffer    @
        @inputMethod    = new InputMethod   @ if atom.config.get('agda-mode.inputMethod')
        @highlight      = new Highlight     @
        @handler        = new Handler       @
        # initialize informations about this editor

        log 'Core', 'initialized:', @editor.getPath()


        #############
        #   Views   #
        #############

        # instantiate
        @atomPanel = atom.workspace.addBottomPanel
            item: document.createElement 'dummy'
            visible: false
            className: 'agda-panel'
        @panel.$mount @atomPanel.item

        @commander      = new Commander     @

    #####################
    #   Editor Events   #
    #####################

    activate: ->
        log 'Core', 'activated:', @editor.getPath()
        @atomPanel.show()
    deactivate: ->
        log 'Core', 'deactivated:', @editor.getPath()
        @atomPanel.hide()
    destroy: ->
        log 'Core', 'destroyed:', @editor.getPath()
        @commander.quit()
        @atomPanel.destroy()
        @disposables.dispose()

module.exports = Core
