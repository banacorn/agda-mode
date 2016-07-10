-- /Users/banacorn/github/agda-mode/spec/error/CaseSingleHole.agda:12,9-17
-- Right hand side must be a single hole when making a case
-- distinction
-- when checking that the expression ? has type A
module CaseSingleHole where

data A : Set where
    a : A
    b : A → A

f : A → A
f x = b {! a  !}
