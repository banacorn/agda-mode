{Transform} = require 'stream'

class ExecuteCommand extends Transform

  constructor: (@agda) ->
    super
      objectMode: true

  _transform: (command, encoding, next) ->

    switch command.type

      when 'info-action: type-checking'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Type Checking'
        @agda.view.panel.appendContent command.content

      when 'info-action: error'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Error', 'error'
        @agda.view.panel.setContent command.content

      when 'info-action: current goal'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Current Goal', 'info'
        @agda.view.panel.setContent command.content

      when 'info-action: context'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Context', 'info'
        @agda.view.panel.setContent command.content

      when 'info-action: goal type etc'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Goal type etc', 'info'
        @agda.view.panel.setContent command.content

      when 'info-action: auto'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Info', 'info'
        @agda.view.panel.setContent command.content

      when 'info-action: normal form'
        @agda.view.attachPanel()
        @agda.view.panel.setStatus 'Normal form', 'info'
        @agda.view.panel.setContent command.content

      when 'info-action: all goals'

        @agda.view.attachPanel()
        indices = []

        # no more goals, all good
        if command.content.length is 0
          @agda.view.panel.setStatus 'No Goals', 'success'
        else
          @agda.view.panel.setStatus 'Goals', 'info'
          # refresh goals with given goals
          indices = command.content
            .map (goal) => /^\?(\d+)\s\:\s/.exec(goal)
            .filter (result) => result isnt null
            .map (result) => parseInt result[1]

        @agda.view.panel.setContent command.content
        @agda.goalManager.resetGoals indices


        # we consider it passed, when this info-action shows up
        @emit 'passed'


      when 'give-action'
        @agda.goalManager.giveHandler command.goalIndex, command.content

      when 'make-case-action'
        @agda.goalManager.caseHandler command.content

    next()

module.exports = ExecuteCommand
