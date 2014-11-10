{EventEmitter} = require 'events'

#
#   CHOP CHOP MOTHERFUCKER !!
#
#   Level:  0   error
#           1   warn
#           2   debug
#
#   display log when level <= @level


class Logger extends EventEmitter
    level: 0
    constructor: ->
        if atom.config.get 'agda-mode.logLevel'
            @level = atom.config.get 'agda-mode.logLevel'
        else
            atom.config.set "agda-mode.logLevel", 0
            @level = 0
        console.log @level
    log: (level) ->
        message = ''
        switch arguments.length
            when 3  # with namespace
                namespace       = arguments[1]
                content         = arguments[2]
                paddingSpace    = ' '.repeat(16 - namespace.length)
                message = "[#{namespace}]#{paddingSpace}#{content}"
            when 2
                content         = arguments[1]
                paddingSpace    = ' '.repeat(18)
                message = "#{paddingSpace}#{content}"
            else throw "Logger: too few arguments"

        switch level
            when 0
                console.error message
            when 1
                console.warn message
            else
                console.log message

    debug: ->
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [3])
        @log.apply @, args

    info: ->
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [3])
        @log.apply @, args

    warn: ->
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [3])
        @log.apply @, args

    error: ->
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [3])
        @log.apply @, args


module.exports = Logger
