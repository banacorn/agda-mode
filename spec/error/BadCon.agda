-- /Users/banacorn/github/agda-mode/spec/error/BadCon.agda:13,8-9
-- The constructor d does not construct an element of F x
-- when checking that the expression d has type (x : D) → F x

module BadCon where

data D : Set where
  d : D

data E : Set where
  d : E

postulate
  F : D -> Set

test : (x : D) -> F x
test = d
