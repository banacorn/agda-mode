module.exports = class AgdaSyntax

  deactivate: ->
    editor = atom.workspace.activePaneItem
    editor.setGrammar(atom.syntax.nullGrammar)

  activate: ->
    grammars = atom.syntax.getGrammars().filter (grammar) ->
      grammar.scopeName is 'source.agda'
    agdaGrammar = if grammars.length is 1 then grammars[0] else undefined

    if agdaGrammar
      # console.log('is .agda and grammar exists')
      editor = atom.workspace.activePaneItem
      editor.setGrammar(agdaGrammar)
