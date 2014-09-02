{Transform} = require 'stream'
code = require './../command-code'

class ParseCommand extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (tokens, encoding, next) ->

    switch tokens[0]

      when "agda2-status-action" then command =
        type: code.STATUS_ACTION
        status: tokens[1]

      when "agda2-info-action" then command =
        type: code.INFO_ACTION
        header: tokens[1]
        content: tokens[2]

      when "agda2-goals-action" then command =
        type: code.GOALS_ACTION
        goals: tokens[1]

      when "agda2-highlight-clear" then command =
        type: code.HIGHLIGHT_CLEAR

      when "agda2-goto" then command =
        type: code.GOTO
        file: tokens[1]
        position: tokens[3]

      when "agda2-highlight-add-annotations" then command =
        type: code.HIGHLIGHT_ADD_ANNOTATIONS

      else
        throw 'wtf is this command? ' + JSON.stringify tokens
        command = type: UNKNOWN

    @push command
    next()

module.exports = ParseCommand
