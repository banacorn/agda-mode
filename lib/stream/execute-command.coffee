{Transform} = require 'stream'

class ExecuteCommand extends Transform

  constructor: (@panel) ->
    super
      objectMode: true

  _transform: (command, encoding, next) ->

    switch command.type

      when 'info-action: type-checking'
        @panel.setStatus 'Type Checking'
        # @panel.setContent command.content
        # @panel.setStatus 'info'

      when 'info-action: error'
        @panel.setStatus 'Error', 'error'
        @panel.setContent command.content
        # @panel.setStatus 'error'


      when 'info-action: all goals'

        # no more goals, all good
        if command.content.length is 0
          @panel.setStatus 'No Goals', 'success'
        else
          @panel.setStatus 'Goals', 'info'

        @panel.setContent command.content

        # we consider it passed, when this info-action shows up
        @emit 'passed'

      # when 'status-action'
      #   @panel.status.text command.status


    next()

module.exports = ExecuteCommand
