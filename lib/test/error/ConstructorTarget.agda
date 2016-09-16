-- /Users/banacorn/github/agda-mode/spec/error/ConstructorTarget.agda:8,5-10
-- The target of a constructor must be the datatype applied to its
-- parameters, ?0 isn't
-- when checking the constructor a in the declaration of A
module ConstructorTarget where

data A : Set where
    a : ?
