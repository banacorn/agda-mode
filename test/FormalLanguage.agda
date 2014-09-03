module FormalLanguage where

open import Data.Bool{}
open import Data.List using (List; []; _∷_; zip)
import Data.List.Any
open Data.List.Any.Membership-≡ using (_∈_ ; _∉_)
open import Relation.Binary.PropositionalEquality
open import Data.Product using (_×_; _,_)
open import Data.Sum using ( _⊎_)
data State : Set where
  ⊕ : State
  ⊝ : State

data Alphabet : Set where
  on : Alphabet
  off : Alphabet

transition : State → Alphabet → State
transition ⊕ on = ⊕
transition ⊕ off = ⊝
transition ⊝ on = ⊕
transition ⊝ off = ⊝



String = List

record DFA (State : Set) (Alphabet : Set) : Set where
  constructor dfa
  field
    δ : State → Alphabet → State
    initialState : State
    finalStates : List State

run : {S A : Set} → DFA S A → String A → Set
run (dfa δ initialState finalStates) [] = initialState ∈ finalStates
run (dfa δ initialState finalStates) (x ∷ s) = run (dfa δ (δ initialState x) finalStates) s
light : DFA State Alphabet
light = dfa transition ⊝ (⊕ ∷ [])

-- Union
_∪_ : {S A : Set} → DFA S A → DFA S A → DFA (S × S) (A × A)
dfa δ initialState finalStates ∪ dfa δ₁ initialState₁ finalStates₁ =
  dfa (λ { (s₀ , s₁) (a₀ , _) → δ s₀ a₀ , δ₁ s₁ a₀ })
      (initialState , initialState₁)
      {!!}


-- Intersection
_∩_ : {S A : Set} → DFA S A → DFA S A
 → DFA (S × S) (A × A)
dfa δ initialState finalStates ∩ dfa δ₁ initialState₁ finalStates₁ =
  dfa (λ {(s₀ , s₁) (a₀ , _) → δ s₀ a₀ , δ₁ s₁ a₀})
      (initialState , initialState₁)
      (zip finalStates finalStates₁)

-- Concatenation
--_∘_ : {S A : Set} → DFA S A → DFA S A → DFA (S × S) (A × A)
