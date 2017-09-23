-- /Users/banacorn/github/agda-mode/spec/error/TypeMismatch.agda:19,9-10
-- B !=< A of type Set
-- when checking that the expression b has type

module TypeMismatch where

data A : Set where
    a : A

data B : Set where
    b : B

value : A
value = b
