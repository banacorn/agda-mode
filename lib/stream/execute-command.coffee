{$} = require 'atom'
{Transform} = require 'stream'
HoleView = require './../view/hole'

class ExecuteCommand extends Transform

  constructor: (@agda) ->
    super
      objectMode: true

  _transform: (command, encoding, next) ->

    switch command.type

      when 'info-action: type-checking'
        @agda.panelView.setStatus 'Type Checking'
        # @panel.setContent command.content
        # @panel.setStatus 'info'

      when 'info-action: error'
        @agda.panelView.setStatus 'Error', 'error'
        @agda.panelView.setContent command.content
        # @panel.setStatus 'error'


      when 'info-action: all goals'

        # no more goals, all good
        if command.content.length is 0
          @agda.panelView.setStatus 'No Goals', 'success'
        else
          @agda.panelView.setStatus 'Goals', 'info'

        @agda.panelView.setContent command.content

        # we consider it passed, when this info-action shows up
        @emit 'passed'

        indicesOf = (string, pattern) ->
          indices = []
          cursor = 0
          result = string.match pattern
          while result
            indices.push result.index + cursor
            cursor += result.index
            string = string.substr (result.index + result[0].length)
            result = string.match pattern
          return indices


        # find all {!!}
        text = @agda.editor.getText()
        indices = indicesOf text, /\{!!\}/
        for index in indices
          point = @agda.editor.buffer.positionForCharacterIndex index
          marker = @agda.editor.markBufferPosition point
          console.log marker
        # hole = new HoleView
        # @agda.editorView.overlayer.append hole

      # when 'status-action'
      #   @panel.status.text command.status


    next()

module.exports = ExecuteCommand
