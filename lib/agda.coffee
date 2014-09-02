AgdaSyntax = require './agda/syntax'
PanelView = require './view/panel'
AgdaExecutable = require './agda/executable'
Stream = require './agda/stream'

{Writable} = require 'stream'
class ExecCommand extends Writable

  constructor: (@panel) ->
    super
      objectMode: true

  _write: (command, encoding, next) ->
    # console.log code.toString command.type
    # console.log command

    switch command.type
      when 'info-action'
        @panel.infoHeader.text command.header
        @panel.infoContent.text command.content
      when 'status-action'
        @panel.status.text command.status


    next()

module.exports = class Agda

  executablePath: null
  loaded: false

  constructor: (@editor) ->
    @syntax = new AgdaSyntax @editor
    @syntax.deactivate()

    @filepath = @editor.getPath()
    @executable = new AgdaExecutable

    @panelView = new PanelView

    @registerHandlers()

  registerHandlers: ->

    @executable.on 'wired', =>
      @loaded = true
      @syntax.activate()
      @panelView.attach()
      @executable.agda.stdout
        .pipe new Stream.Rectify
        .pipe new Stream.Preprocess
        .pipe new Stream.Log
        .pipe new Stream.ParseSExpr
        .pipe new Stream.ParseCommand
        .pipe new ExecCommand @panelView

      command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" [])\n'
      @executable.agda.stdin.write command

  load: ->
    if not @loaded
      @executable.wire()
    else
      @restart()


  quit: ->
    if @loaded
      @loaded = false
      @syntax.deactivate()

  restart: ->
    @quit()
    @load()
