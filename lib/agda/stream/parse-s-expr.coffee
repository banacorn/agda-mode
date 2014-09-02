{Transform} = require 'stream'

class ParseSExpr extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->
    [tokens, rest] = @takeList chunk
    @push tokens
    next()

  # helper function from Haskell
  head: (string) -> string.substr 0, 1
  tail: (string) -> string.substr 1
  take: (n, string) -> string.substr 0, n
  drop: (n, string) -> string.substr n

  # (a b "c" '(d r)) => [a, b, "c", [d, r]]
  takeList: (string) ->
    tokens = []

    # drop "("
    string = @tail string

    while (string[0] isnt ')')
      switch @head string
        when ' '
          string = @tail string
          # console.log '[SPACE]', [string]
        when '('
          [token, string] = @takeList string
          # console.log '[List]', [token, string]
          tokens.push token
        when '\''
          string = @tail string
          [token, string] = @takeList string
          # console.log '[Quote]', [token, string]
          tokens.push token
        when '"'
          [token, string] = @takeString string
          # console.log '[String]', [token, string]
          tokens.push token
        else
          [token, string] = @takeAtom string
          # console.log '[Atom]', [token, string]
          tokens.push token
    rest = @tail string
    return [tokens, rest]

  takeAtom: (string) ->

    indexI = string.indexOf ' '
    indexP = string.indexOf ')'
    indexE = string.length

    # find the end of the atom, a space or a closing parenthesis,
    # maybe both, choose the nearest
    if indexI isnt -1 and indexP isnt -1
      if indexI < indexP
        index = indexI
      else
        index = indexP
    else if indexI isnt -1
      index = indexI
    else if indexP isnt -1
      index = indexP
    else
      index = indexE

    token = @take index, string
    rest = @drop index, string
    return [token, rest]

  takeString: (string) ->

    # drop "
    string = @tail string

    indexQ = string.indexOf '"'

    token = @take indexQ, string
    rest = @drop (indexQ + 1), string    # indexQ+1 to drop the closing "

    return [token, rest]

module.exports = ParseSExpr
