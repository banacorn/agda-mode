{Transform} = require 'stream'

class ExecuteCommand extends Transform

  constructor: (@panel) ->
    super
      objectMode: true

  _transform: (command, encoding, next) ->

    switch command.type

      when 'info-action: type-checking'
        @panel.setStatus 'Type Checking'
        @panel.addInfoContent command.content
        # @panel.setStatus 'info'

      when 'info-action: error'
        @panel.setStatus 'Error', 'error'
        @panel.content.text command.content
        # @panel.setStatus 'error'


      when 'info-action: all goals'
        @panel.setStatus 'All Goals', 'info'
        @panel.content.text command.content
        console.log command.content
        # we consider it passed, when this info-action shows up
        @emit 'passed'

      # when 'status-action'
      #   @panel.status.text command.status


    next()

module.exports = ExecuteCommand
