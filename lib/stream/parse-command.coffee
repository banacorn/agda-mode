{Transform} = require 'stream'
_ = require 'lodash'

class ParseCommand extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (tokens, encoding, next) ->

    switch tokens[0]

      when 'agda2-status-action' then command =
        type: 'status-action'
        status: tokens[1]

      when 'agda2-info-action'
        content = _.compact tokens[2].split '\\n'
        switch tokens[1]
          when '*Type-checking*' then command =
            type: 'info-action: type-checking'
            content: content

          when '*Error*' then command =
            type: 'info-action: error'
            content: content

          when '*All Goals*' then command =
            type: 'info-action: all goals'
            content: content

          else
            throw 'wtf is this info-action? ' + JSON.stringify tokens
            command = type: 'info-action: unknown'

      when 'agda2-goals-action' then command =
        type: 'goals-action'
        goals: tokens[1]

      when 'agda2-highlight-clear' then command =
        type: 'highlight-clear'

      when 'agda2-goto' then command =
        type: 'goto'
        file: tokens[1]
        position: tokens[3]

      when 'agda2-highlight-add-annotations' then command =
        type: 'highlight-add-annotations'

      when 'agda2-highlight-load-and-delete-action' then command =
        type: 'highlight-load-and-delete-action'

      when 'agda2-give-action' then command =
        type: 'give-action'

      else
        throw 'wtf is this command? ' + JSON.stringify tokens
        command = type: 'unknown'

    @push command
    next()

module.exports = ParseCommand
