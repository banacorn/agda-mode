-- /Users/banacorn/github/agda-mode/spec/error/FunctionType.agda:7,9-10
-- Set should be a function type, but it isn't
-- when checking that A is a valid argument to a function of type Set
module FunctionType where

data A : Set where
    a : A A
