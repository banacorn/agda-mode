-- /Users/banacorn/github/agda-mode/spec/error/DefinitionTypeMismatch.agda:8,6-7
-- A != Set _1 of type Set
-- when checking the definition of B
module DefinitionTypeMismatch where

data A : Set where

data B : A where
