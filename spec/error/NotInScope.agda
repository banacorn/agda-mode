-- /Users/banacorn/github/agda-mode/spec/error/NotInScope.agda:7,5-7
-- Not in scope:
--   bb
--   at /Users/banacorn/github/agda-mode/spec/error/NotInScope.agda:7,5-7
-- when scope checking bb

module NotInScope where

data A : Set where
    a : A

b : A
b = bb
