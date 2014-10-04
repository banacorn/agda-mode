module Banana where

data ℕ : Set where
  zero : ℕ
  suc : ℕ → ℕ




















_+_ : ℕ → ℕ → ℕ
zero + b = b
suc a + b = suc (a + b)
