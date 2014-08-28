module.exports = class AgdaSyntaxManager
  start: ->
    @deactiveAgdaSyntax()
    atom.workspaceView.on 'pane-container:active-pane-item-changed', =>
      @deactiveAgdaSyntax()

    atom.workspaceView.command 'agda-mode:load', =>
      @activeAgdaSyntax()

    atom.workspaceView.command 'agda-mode:quit', =>
      @deactiveAgdaSyntax()

  isAgdaFile: ->
    editor = atom.workspace.activePaneItem
    filePath = editor.getPath?()
    /\.agda$/.test filePath

  deactiveAgdaSyntax: ->
    if @isAgdaFile()
      editor = atom.workspace.activePaneItem
      editor.setGrammar(atom.syntax.nullGrammar)

  activeAgdaSyntax: ->
    if @isAgdaFile()
      grammars = atom.syntax.getGrammars().filter (grammar) ->
        grammar.scopeName is 'source.agda'
      agdaGrammar = if grammars.length is 1 then grammars[0] else undefined

      if agdaGrammar
        # console.log('is .agda and grammar exists')
        editor = atom.workspace.activePaneItem
        editor.setGrammar(agdaGrammar)
