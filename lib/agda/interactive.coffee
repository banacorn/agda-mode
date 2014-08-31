{spawn} = require 'child_process'

module.exports = class AgdaInteractive

  constructor: (@filename) ->


  # wire up with the Agda executable
  start: ->
    executablePath = atom.config.get 'agda-mode.agdaExecutablePath'
    @agda = spawn executablePath, ['--interaction']
    console.log @agda.pid
    @agda.stdout.on 'data', (data) =>
      console.log data.toString()
    @agda.stderr.on 'data', (data) =>
      console.log data
    @agda.on 'close', (code) =>
      console.log 'agda process exited with code', code


  load: ->
    command = 'IOTCM "' + @filename + '" None Direct (Cmd_load "' + @filename + '" [])\n'
    console.log command
    @agda.stdin.write command

  quit: ->
    @agda.stdin.end()
