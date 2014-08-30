AgdaSyntax = require './agda-syntax'

module.exports = class Agda

  executablePath: null

  syntax: new AgdaSyntax

  constructor: ->
    console.log 'initialized'
