{Transform} = require 'stream'

class ParseCommand extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (tokens, encoding, next) ->

    ripPrefix = (s) -> s.substr 6

    switch tokens[0]

      when "agda2-status-action" then command =
        type: ripPrefix tokens[0]
        status: tokens[1]

      when "agda2-info-action" then command =
        type: ripPrefix tokens[0]
        header: tokens[1]
        content: tokens[2]

      when "agda2-goals-action" then command =
        type: ripPrefix tokens[0]
        goals: tokens[1]

      when "agda2-highlight-clear" then command =
        type: ripPrefix tokens[0]

      when "agda2-goto" then command =
        type: ripPrefix tokens[0]
        file: tokens[1]
        position: tokens[3]

      when "agda2-highlight-add-annotations" then command =
        type: ripPrefix tokens[0]

      else
        throw 'wtf is this command? ' + JSON.stringify tokens
        command = type: 'unknown'

    @push command
    next()

module.exports = ParseCommand
