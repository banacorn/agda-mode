{EventEmitter} = require 'events'

QueryExecutablePath = require './panel/query-executable-path'

class Panel extends EventEmitter
    queryExecutablePath: QueryExecutablePath

module.exports = Panel
