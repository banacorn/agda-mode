module.exports = class AgdaSyntax

  constructor: (@editor) ->

  deactivate: ->
    @editor.setGrammar atom.syntax.nullGrammar

  activate: ->
    grammars = atom.syntax.getGrammars().filter (grammar) ->
      grammar.scopeName is 'source.agda'
    agdaGrammar = if grammars.length is 1 then grammars[0] else undefined

    if agdaGrammar
      @editor.setGrammar agdaGrammar
