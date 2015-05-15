{log, warn, error} = require './logger'

module.exports = class Config
    executablePath: ->
        atom.config.get 'agda-mode.executablePath'
    directHighlighting: ->
        if atom.config.get 'agda-mode.directHighlighting'
            'Direct'
        else
            'Indirect'
    libraryPath: ->
        # get library paths, with current directory '.'
        paths = atom.config.get 'agda-mode.libraryPath'
        log 'Executable', "loading #{paths}"
        paths.unshift '.'
        return paths.map((path) -> '\"' + path + '\"').join(', ')
    improveMessage: ->
        atom.config.get 'agda-mode.improveMessage'
