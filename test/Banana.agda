module Banana where

data ℕ : Set where
    zero : ℕ
    suc : ℕ → ℕ

a : ℕ → ℕ
a zero = {!   !}
a (suc zero) = {!   !}
a (suc (suc x)) = {!   !}

f : ℕ → ℕ → ℕ → ℕ
f a b c = {!   !}

-- b : ℕ
-- b = {!   !}

c : ℕ → ℕ → ℕ → ℕ
c x y z = f {!   !} {!   !} {!   !}
