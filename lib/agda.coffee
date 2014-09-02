AgdaSyntax = require './agda/syntax'
PanelView = require './view/panel'
AgdaExecutable = require './agda/executable'
Stream = require './stream'
{Writable} = require 'stream'

class ExecCommand extends Writable

  constructor: (@panel) ->
    super
      objectMode: true

  _write: (command, encoding, next) ->

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

module.exports = class Agda

  executablePath: null
  loaded: false
  passed: false

  constructor: (@editor) ->
    @syntax = new AgdaSyntax @editor

    @filepath = @editor.getPath()
    
    @executable = new AgdaExecutable

    @panelView = new PanelView

    @registerHandlers()

  registerHandlers: ->

    @executable.on 'wired', =>
      @loaded = true

      @panelView.attach()

      @commandExecutor = new ExecCommand @panelView
      @commandExecutor.on 'passed', =>
        @passed = true
        @syntax.activate()

      @executable.agda.stdout
        .pipe new Stream.Rectify
        .pipe new Stream.Preprocess
        .pipe new Stream.Log
        .pipe new Stream.ParseSExpr
        .pipe new Stream.ParseCommand
        .pipe @commandExecutor

      includeDir = atom.config.get 'agda-mode.agdaLibraryPath'
      if includeDir
        command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" ["./", "' + includeDir + '"])\n'
      else
        command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" [])\n'
      @executable.agda.stdin.write command

  load: ->
    console.log '========='
    if not @loaded
      @executable.wire()
    else
      @restart()


  quit: ->
    if @loaded
      @loaded = false
      @passed = false
      @syntax.deactivate()

  restart: ->
    @quit()
    @executable.wire()
