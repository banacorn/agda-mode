{-# OPTIONS --without-K #-}

module Test where

open import Level

infixl 4 _≡_
data _≡_ {a} {A : Set a} (x : A) : A → Set a where
  refl : x ≡ x


J : {a b : Level} (A : Set a) (C : (x y : A) → x ≡ y → Set b)
    → ((x : A) → C x x refl)
    → (x y : A) (P : x ≡ y)
    → C x y P
J A C b x .x refl = b x

-- K : (A : Set) (x : A) (C : x ≡ x → Set)
--   → C refl
--   → (loop : x ≡ x)
--   → C loop
-- K A x C b p = {! p  !}

-- Lemma 2.1.1 (inversion of paths)
infix 6 ¬_
¬_ : {a : Level} {A : Set a} {x y : A} → x ≡ y → y ≡ x
¬_ {a} {A} {x} {y} p = J A D d x y p

  where
    D : (x y : A) (p : x ≡ y) → Set a
    D x y p = y ≡ x

    d : (x : A) → D x x refl
    d x = refl


-- Lemma 2.1.2 (concatenation of paths)
infixl 5 _∙_
_∙_ : {a : Level} {A : Set a} {x y z : A} → x ≡ y → y ≡ z → x ≡ z
_∙_ {a} {A} {x} {y} {z} p q = J {a} {a} A D d x y p z q

  where
    -- the predicate
    D : (x y : A) (p : x ≡ y) → Set a
    D x y p = (z : A) (q : y ≡ z) → x ≡ z

    -- base case
    d : (x : A) → D x x refl
    d x z q = J A E e x z q
      where
        -- the predicate
        E : (x z : A) (q : x ≡ z) → Set a
        E x z q = x ≡ z

        -- base case
        e : (x : A) → E x x refl
        e x = refl


-- Lemma 2.1.4.i (identity of path concatenation)
∙-identityʳ : {a : Level} {A : Set a} {x y : A} (p : x ≡ y) → p ≡ p ∙ refl
∙-identityʳ {a} {A} {x} {y} p = J A D d x y p

  where
    -- the predicate
    D : (x y : A) (p : x ≡ y) → Set a
    D x y p = p ≡ p ∙ refl

    -- base case
    d : (x : A) → D x x refl
    d x = refl

∙-identityˡ : {a : Level} {A : Set a} {x y : A} (p : x ≡ y) → p ≡ refl ∙ p
∙-identityˡ {a} {A} {x} {y} p = J A D d x y p
  where
    -- the predicate
    D : (x y : A) (p : x ≡ y) → Set a
    D x y p = p ≡ refl ∙ p

    -- base case
    d : (x : A) → D x x refl
    d x = refl

-- Lemma 2.1.4.ii (identity of path inversion)
¬-identityʳ : {a : Level} {A : Set a} {x y : A} (p : x ≡ y) → ¬ p ∙ p ≡ refl
¬-identityʳ {a} {A} {x} {y} p = J A D d x y p
  where
    -- the predicate
    D : (x y : A) (p : x ≡ y) → Set a
    D x y p = ¬ p ∙ p ≡ refl

    -- base case
    d : (x : A) → D x x refl
    d x = refl

¬-identityˡ : {a : Level} {A : Set a} {x y : A} (p : x ≡ y) → p ∙ ¬ p ≡ refl
¬-identityˡ {a} {A} {x} {y} p = J A D d x y p
  where
    -- the predicate
    D : (x y : A) (p : x ≡ y) → Set a
    D x y p = p ∙ ¬ p ≡ refl

    -- base case
    d : (x : A) → D x x refl
    d x = refl

-- Lemma 2.1.4.iii (involution of path inversion)
involution : {A : Set} {x y : A} (p : x ≡ y) → ¬ ¬ p ≡ p
involution {A} {x} {y} p = J A D d x y p
  where
    -- the predicate
    D : (x y : A) (p : x ≡ y) → Set
    D x y p = ¬ ¬ p ≡ p

    -- base case
    d : (x : A) → D x x refl
    d x = refl

-- Lemma 2.1.4.iv (associativity of path concatenation)
∙-assoc : {a : Level} {A : Set a} {w x y z : A}
  → (p : w ≡ x) (q : x ≡ y) (r : y ≡ z)
  → p ∙ (q ∙ r) ≡ (p ∙ q) ∙ r
∙-assoc {a} {A} {w} {x} {y} {z} p q r = J A D d w x p y q z r
  where
    -- the predicate
    D : (w x : A) (p : w ≡ x) → Set a
    D w x p = (y : A) (q : x ≡ y)
            → (z : A) (r : y ≡ z)
            → p ∙ (q ∙ r) ≡ (p ∙ q) ∙ r

    -- base case
    d : (x : A) → D x x refl
    d x y q z r = J A E e x y q z r
      where
        -- the predicate
        E : (x y : A) (q : x ≡ y) → Set a
        E x y q = (z : A) (r : y ≡ z)
                → refl ∙ (q ∙ r) ≡ refl ∙ q ∙ r

        -- base case
        e : (x : A) → E x x refl
        e x z r = J A F f x z r
          where
            -- the predicate
            F : (y z : A) (r : y ≡ z) → Set a
            F y z r = refl ∙ (refl ∙ r) ≡ refl ∙ refl ∙ r

            -- base case
            f : (x : A) → F x x refl
            f x = {!   !}
