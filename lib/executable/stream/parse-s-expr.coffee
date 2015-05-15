{Transform} = require 'stream'
lispToArray = require 'lisp-to-array'
_ = require 'lodash'

class ParseSExpr extends Transform

    constructor: ->
        super
            objectMode: true

    _transform: (chunk, encoding, next) ->
        @push postprocess(lispToArray(preprocess(chunk)))
        next()

preprocess = (chunk) ->
    if chunk.startsWith '((last'
        # drop wierd prefix like ((last . 1))
        index = chunk.indexOf '(agda'
        length = chunk.length
        chunk = chunk.substring index, length - 1
    if chunk.startsWith 'cannot read: '
        # handles Agda parse error
        chunk = chunk.substring 12
        chunk = '(agda2-parse-error' + chunk + ')'
    # make it friendly to 'lisp-to-array' package
    chunk = chunk.replace /'\(/g, '(__number__ '
    chunk = chunk.replace /\("/g, '(__string__ "'
    chunk = chunk.replace /\(\)/g, '(__nil__)'
    return chunk

# cosmetic surgery, recursively
postprocess = (node) ->
    if node instanceof Array
        switch node[0]

            when "`"
                # ["`", "some string"] => "some string"
                return postprocess node[1]

            when "__number__", "__string__", "__nil__"
                # ["__number__", 1, 2, 3] => [1, 2, 3]
                # ["__string__", 1, 2, 3] => [1, 2, 3]
                # ["__nil__"]             => []
                node.shift()
                return postprocess node

            else
                # keep traversing
                return node.map (x) -> postprocess x
    else
        # some ()s in strings were replaced with (__nil__) when preprocessing
        return node.replace?('(__nil__)', '()')

module.exports = ParseSExpr
