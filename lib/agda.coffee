AgdaSyntax = require './agda-syntax'

module.exports = class Agda

  executablePath: null

  constructor: (@editor) ->
    console.log 'initialized'

    @syntax = new AgdaSyntax @editor
