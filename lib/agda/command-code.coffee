commands = [
  'UNKNOWN'
  'STATUS_ACTION'
  'INFO_ACTION'
  'GOALS_ACTION'
  'HIGHLIGHT_CLEAR'
  'HIGHLIGHT_ADD_ANNOTATIONS'
  'GOTO'
]

# insert codes
module.exports = {}
code = 0
for command in commands
  module.exports.command = code
  code++

# insert toString function
module.exports.toString = (n) -> command[n]
