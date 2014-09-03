{Transform} = require 'stream'

class ExecuteCommand extends Transform

  constructor: (@panel) ->
    super
      objectMode: true

  _transform: (command, encoding, next) ->

    switch command.type

      when 'info-action: type-checking'
        @panel.infoHeader.text 'Type Checking'
        @panel.infoContent.text command.content
        @panel.setStatus 'info'

      when 'info-action: error'
        @panel.infoHeader.text 'Error'
        @panel.infoContent.text command.content
        @panel.setStatus 'error'

      when 'info-action: all goals'
        @panel.infoHeader.text 'All Goals'
        @panel.infoContent.text command.content
        @panel.setStatus()

        # we consider it passed, when this info-action shows up
        @emit 'passed'

      # when 'status-action'
      #   @panel.status.text command.status


    next()

module.exports = ExecuteCommand
