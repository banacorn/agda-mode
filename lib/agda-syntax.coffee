module.exports = class AgdaSyntax

  constructor: (@editor) ->

  deactivate: ->
    @editor.setGrammar atom.syntax.nullGrammar
    # selection = @editor.selectAll()
    # console.log selection[0].getText()
    # selection[0].insertText 'fuck'
    # selection[0].delete()
    # console.log @editor.selectAll()[0].insertText 'fuck you'
    # @editor.selectAll()[0].insertText 'fuck you'
    # @editor.selectAll().insertText 'fuck you'

  activate: ->
    grammars = atom.syntax.getGrammars().filter (grammar) ->
      grammar.scopeName is 'source.agda'
    agdaGrammar = if grammars.length is 1 then grammars[0] else undefined

    if agdaGrammar
      @editor.setGrammar agdaGrammar
