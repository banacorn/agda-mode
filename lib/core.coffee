_ = require 'lodash'
{$} = require 'atom-space-pen-views'
{log, warn, error} = require './logger'
{Range, CompositeDisposable} = require 'atom'

# Components
Commander   = require './commander'
Executable  = require './executable'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'
Highlight   = require './highlight'
Config      = require './config'
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
        @config         = new Config
        @disposables    = new CompositeDisposable
        @panel          = new Panel
        @executable     = new Executable    @
        @textBuffer     = new TextBuffer    @
        @inputMethod    = new InputMethod   @
        @highlight      = new Highlight     @
        @handler        = new Handler       @
        # initialize informations about this editor
        @filepath = @editor.getPath()

        log 'Core', 'initialized:', @filepath


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
        log 'Core', 'activated:', @filepath
        @atomPanel.show()
    deactivate: ->
        log 'Core', 'deactivated:', @filepath
        @atomPanel.hide()
    destroy: ->
        log 'Core', 'destroyed:', @filepath
        @commander.quit()
        @atomPanel.destroy()
        @disposables.dispose()

module.exports = Core
