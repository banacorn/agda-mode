-- /Users/banacorn/github/agda-mode/spec/error/NotInScopeWithSuggestion.agda:13,5-9
-- Not in scope:
--   aaaa
--   at /Users/banacorn/github/agda-mode/spec/error/NotInScopeWithSuggestion.agda:13,5-9
--     (did you mean
--        'A.aaa' or
--        'aaa'?)
-- when scope checking aaaa

module NotInScopeWithSuggestion where

data A : Set where
    aaa : A

b : A
b = aaaa
