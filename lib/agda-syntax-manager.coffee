module.exports = class AgdaSyntaxManager
  isAgdaFile: ->
    editor = atom.workspace.activePaneItem
    filePath = editor.getPath?()
    /\.agda$/.test filePath

  deactivate: ->
    if @isAgdaFile()
      editor = atom.workspace.activePaneItem
      editor.setGrammar(atom.syntax.nullGrammar)

  activate: ->
    if @isAgdaFile()
      grammars = atom.syntax.getGrammars().filter (grammar) ->
        grammar.scopeName is 'source.agda'
      agdaGrammar = if grammars.length is 1 then grammars[0] else undefined

      if agdaGrammar
        # console.log('is .agda and grammar exists')
        editor = atom.workspace.activePaneItem
        editor.setGrammar(agdaGrammar)
