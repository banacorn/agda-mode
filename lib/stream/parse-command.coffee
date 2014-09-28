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

          when '*Current Goal*' then command =
            type: 'info-action: current goal'
            content: content

          when '*Context*' then command =
            type: 'info-action: context'
            content: content

          when '*Goal type etc.*' then command =
            type: 'info-action: goal type etc'
            content: content

          when '*Auto*' then command =
            type: 'info-action: auto'
            content: content

          when '*Normal Form*' then command =
            type: 'info-action: normal form'
            content: content
          else
            throw 'wtf is this info-action? ' + JSON.stringify tokens
            command = type: 'info-action: unknown'

      when 'agda2-goals-action' then command =
        type: 'goals-action'
        goals: tokens[1]

      when 'agda2-goto' then command =
        type: 'goto'
        file: tokens[1]
        position: tokens[3]

      when 'agda2-give-action' then command =
        type: 'give-action'
        holeIndex: parseInt tokens[1]
        content: if typeof tokens[2] is 'string' then tokens[2] else null

      when 'agda2-make-case-action' then command =
        type: 'make-case-action'
        content: tokens[1]

      #
      #   highlighting shit
      #

      when 'agda2-highlight-clear' then command =
        type: 'highlight-clear'

      when 'agda2-highlight-add-annotations' then command =
        type: 'highlight-add-annotations'

      when 'agda2-highlight-load-and-delete-action' then command =
        type: 'highlight-load-and-delete-action'

      #
      #   Agda cannot read our input
      #

      when 'annot'
        throw 'cannot read: ' + JSON.stringify tokens
      else
        throw 'wtf is this command? ' + JSON.stringify tokens
        command = type: 'unknown'

    @push command
    next()

module.exports = ParseCommand
