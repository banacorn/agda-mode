{$} = require 'atom'
{Transform} = require 'stream'

class ExecuteCommand extends Transform

  constructor: (@agda) ->
    super
      objectMode: true

  _transform: (command, encoding, next) ->

    switch command.type

      when 'info-action: type-checking'
        @agda.panelView.setStatus 'Type Checking'
        @agda.panelView.appendContent command.content

      when 'info-action: error'
        @agda.panelView.setStatus 'Error', 'error'
        @agda.panelView.setContent command.content

      when 'info-action: current goal'
        @agda.panelView.setStatus 'Current Goal', 'info'
        @agda.panelView.setContent command.content

      when 'info-action: context'
        @agda.panelView.setStatus 'Context', 'info'
        @agda.panelView.setContent command.content

      when 'info-action: goal type etc'
        @agda.panelView.setStatus 'Goal type etc', 'info'
        @agda.panelView.setContent command.content

      when 'info-action: auto'
        @agda.panelView.setStatus 'Info', 'info'
        @agda.panelView.setContent command.content

      when 'info-action: all goals'

        # no more goals, all good
        if command.content.length is 0
          @agda.panelView.setStatus 'No Goals', 'success'
        else
          @agda.panelView.setStatus 'Goals', 'info'

        # refresh holes with given goals
        indices = command.content.map (goal) => parseInt /^\?(\d+)\s\:\s/.exec(goal)[1]
        @agda.panelView.setContent command.content
        @agda.holeManager.resetGoals indices


        # we consider it passed, when this info-action shows up
        @emit 'passed'


      when 'give-action'
        @agda.holeManager.giveHandler command.holeIndex, command.content

      when 'make-case-action'
        @agda.holeManager.caseHandler command.content

    next()

module.exports = ExecuteCommand
