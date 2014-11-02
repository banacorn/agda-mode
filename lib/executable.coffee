{EventEmitter} = require 'events'
{spawn, exec} = require 'child_process'
Q = require 'Q'


class Executable extends EventEmitter

    # instance wired the agda-mode executable
    wired: false

    constructor: (@core) ->

    # locate the path and see if it is Agda executable
    validateExecutablePath: (path) -> Q.Promise (resolve, reject, notify) =>
        command = path + ' -V'
        exec command, (error, stdout, stderr) =>
            if /^Agda version/.test stdout
                resolve path
            else
                reject error if error
                reject stderr if stderr

    _getExecutablePath: ->
        path = atom.config.get 'agda-mode.agdaExecutablePath'
        @validateExecutablePath path
            .then (path) => path
            .fail        => @_queryExecutablePathUntilSuccess()
    _queryExecutablePathUntilSuccess: ->
        view = new @core.panel.queryExecutablePath
        view.promise
            .then (path) => @validateExecutablePath path
            .then (path) =>
                atom.config.set 'agda-mode.agdaExecutablePath', path
                path
            .fail        => @_queryExecutablePathUntilSuccess()

    load: ->
        @_getExecutablePath()
            .then (path) =>
                console.log "[Executable] got path #{path}"



module.exports = Executable
