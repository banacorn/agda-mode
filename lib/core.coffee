_ = require 'lodash'
{$} = require 'atom-space-pen-views'
{log, warn, error} = require './logger'
{Range, CompositeDisposable} = require 'atom'


# Components
Commander   = require './commander'
Executable  = require './executable'
PanelModel  = require './panel/model'
PanelView   = require './panel/view'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'
Highlight   = require './highlight'
Config      = require './config'
Handler     = require './handler'

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
    
        @executable     = new Executable    @
        @panelModel     = new PanelModel    @
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

        # register panel view, fuck Atom's everchanging always outdated documentation
        @disposables.add atom.views.addViewProvider PanelModel, (model) =>
            view = new PanelView
            view.setModel model
            return $(view).get(0)

        # instantiate
        @panel = atom.workspace.addBottomPanel
            item: atom.views.getView @panelModel
            visible: false
            className: 'agda-panel'

        @commander      = new Commander     @

    #####################
    #   Editor Events   #
    #####################

    activate: ->
        log 'Core', 'activated:', @filepath
        @panel.show()
    deactivate: ->
        log 'Core', 'deactivated:', @filepath
        @panel.hide()
    destroy: ->
        log 'Core', 'destroyed:', @filepath
        @commander.quit()
        @panel.destroy()
        @disposables.dispose()

module.exports = Core
