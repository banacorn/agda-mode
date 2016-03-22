_ = require 'lodash'
{parsePath} = require './util'
{Range, CompositeDisposable} = require 'atom'

# Components
Commander   = require './commander'
Process     = require './process'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'
Highlight   = require './highlight'
Handler     = require './handler'
Panel       = require './panel'

class Core

    getPath: -> parsePath @editor.getPath()

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
        @process        = new Process       @
        @textBuffer     = new TextBuffer    @
        @inputMethod    = new InputMethod   @ if atom.config.get('agda-mode.inputMethod')
        @highlight      = new Highlight     @
        @handler        = new Handler       @
        # initialize informations about this editor


        #############
        #   Views   #
        #############

        # instantiate
        @atomPanel = atom.workspace.addBottomPanel
            item: document.createElement 'agda-panel'
            visible: false
            className: 'agda-panel'
        @panel.$mount @atomPanel.item
        @panel.$on 'jump-to-goal', (index) =>
            @textBuffer.jumpToGoal parseInt(index.substr(1))
        @panel.$on 'jump-to-location', (location) =>
            @textBuffer.jumpToLocation location
        @panel.$on 'select-key', (key) =>
            @inputMethod.insertChar key
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        @panel.$on 'select-symbol', (symbol) =>
            @inputMethod.insertSymbol symbol
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        @panel.$on 'replace-symbol', (symbol) =>
            @inputMethod.replaceString symbol


        @commander      = new Commander     @

    #####################
    #   Editor Events   #
    #####################

    activate: ->
        @atomPanel.show()
    deactivate: ->
        @atomPanel.hide()
    destroy: ->
        @commander.quit()
        @atomPanel.destroy()
        @disposables.dispose()

module.exports = Core
