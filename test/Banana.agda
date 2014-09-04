module Banana where

data Banana : Set where
    peeled : Banana
    unpeeled : Banana

data Nat : Set where
  Z : Nat
  S : Nat -> Nat

a : Banana
a = {!!}

b : Banana
b = {!!}
