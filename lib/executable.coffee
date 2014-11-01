{EventEmitter} = require 'events'
{spawn, exec} = require 'child_process'
Q = require 'Q'


class Executable extends EventEmitter

    # instance wired the agda-mode executable
    wired: false

    # locate the path and see if it is Agda executable
    _validateExecutablePath: (path) -> Q.Promise (resolve, reject, notify) =>
        command = path + ' -V'
        exec command, (error, stdout, stderr) =>
            if /^Agda version/.test stdout
                resolve path
            else
                reject error if error
                reject stderr if stderr

    _getExecutablePath: ->
        path = atom.config.get 'agda-mode.agdaExecutablePath'
        @_validateExecutablePath path
            .then (path) => return path
            .fail        => @_queryExecutablePath()

    _queryExecutablePath: -> Q.Promise (resolve, reject, notify) =>
        @once 'got executable path', (path) =>
            @_validateExecutablePath path
                .then (path) => resolve path
                .fail        => @_queryExecutablePath()
        @emit 'query executable path'

    load: ->
        @_getExecutablePath()
            .then (path) =>
                console.log "[Executable] got path #{path}"



module.exports = Executable
