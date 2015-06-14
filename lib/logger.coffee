#
#   CHOP CHOP MOTHERFUCKER !!
#
#   Level:  0   error
#           1   warn
#           2   debug
#
#   display log when level <= atom.config.get 'agda-mode.logLevel'

class Logger
    printMessage: (level) ->
        message = ''
        switch arguments.length
            when 2
                content         = arguments[1]
                paddingSpace    = ' '.repeat(18)
                message = "#{paddingSpace}#{content}"
            when 3  # with namespace
                namespace       = arguments[1]
                content         = arguments[2]
                paddingSpace    = ' '.repeat(16 - namespace.length)
                message = "#{namespace}#{paddingSpace}#{content}"
            when 4  # with namespace and file path
                namespace       = arguments[1]
                content         = arguments[2]
                filepath        = arguments[3]
                paddingSpace    = ' '.repeat(16 - namespace.length)
                paddingSpace2   = ' '.repeat(48 - content.length)
                message = "#{namespace}#{paddingSpace}#{content}#{paddingSpace2}#{filepath}"
            else throw "Logger: too few arguments"

        if level <= atom.config.get 'agda-mode.logLevel'
            switch level
                when 0
                    console.error message
                when 1
                    console.warn message
                else
                    console.log message

    log: =>
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [2])
        @printMessage.apply @, args

    warn: =>
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [1])
        @printMessage.apply @, args

    error: =>
        args = Array.prototype.slice.call(arguments, 0)
        Array.prototype.unshift.call(args, [0])
        @printMessage.apply @, args


module.exports = new Logger
