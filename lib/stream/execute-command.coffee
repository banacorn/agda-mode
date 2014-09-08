{$} = require 'atom'
{Transform} = require 'stream'
HoleManager = require './../hole-manager'

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

        @agda.holeManager = new HoleManager @agda
      # when 'status-action'
      #   @panel.status.text command.status


    next()

module.exports = ExecuteCommand
