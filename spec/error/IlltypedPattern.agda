-- https://github.com/agda/agda/blob/acc9bd12b455ecfa118381cca4cd8f9522ef96c8/test/Fail/IlltypedPattern.agda
module IlltypedPattern where

data Nat : Set where
  zero : Nat
  suc  : Nat -> Nat

f : (A : Set) -> A -> A
f A zero = zero

-- IlltypedPattern.agda:9,5-9
-- Type mismatch
-- when checking that the pattern zero has type A
