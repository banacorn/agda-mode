-- /Users/banacorn/github/agda-mode/spec/error/PatternMatchOnNonDatatype.agda:7,7-15
-- Cannot pattern match on non-datatype Set _5
-- when checking that the expression ? has type x
module PatternMatchOnNonDatatype where

f : ∀ {A} A → A
f x = {! x  !}  -- <=== case this hole
