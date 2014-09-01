module.exports =
  UNKNOWN:          0
  STATUS_ACTION:    1
  INFO_ACTION:      2
  GOALS_ACTION:     3
  HIGHLIGHT_CLEAR:  4
  toString: (n) -> switch n
    when 0 then 'UNKNOWN'
    when 1 then 'STATUS_ACTION'
    when 2 then 'INFO_ACTION'
    when 3 then 'GOALS_ACTION'
    when 4 then 'HIGHLIGHT_CLEAR'
