open Rebase;

type t = {
  // the symbol at the front of the sequence along with the sequence it replaced
  symbol: option((string, string)),
  // the sequence following the symbol we see on the text editor
  tail: string,
};

// examples of Buffer.t:
//    user typed: l       => { symbol: Some("←", "l"), tail: "" }
//    user typed: lambd   => { symbol: Some("←", "lambd"), tail: "ambd" }
//    user typed: lambda   => { symbol: Some("λ", "lambda"), tail: "" }

let init = string =>
  Js.String.substring(~from=0, ~to_=String.length(string) - 1, string);

let initial = {symbol: None, tail: ""};

let isEmpty = self => {
  self.symbol == None && String.isEmpty(self.tail);
};

let toSequence = self =>
  switch (self.symbol) {
  | None => self.tail
  | Some((_, sequence)) => sequence ++ self.tail
  };

let toSurface = self =>
  switch (self.symbol) {
  | None => self.tail
  | Some((symbol, _)) => symbol ++ self.tail
  };

let toString = self =>
  "\"" ++ toSurface(self) ++ "\"[" ++ toSequence(self) ++ "]";

type action =
  | Noop
  | Insert(t) // update the buffer accordingly
  | Backspace(t) // update the buffer accordingly
  | Rewrite(t) // should rewrite the text buffer
  | Complete // should deactivate
  | Stuck(int); // should deactivate, too

// devise the next state
let next = (self, reality) => {
  let surface = toSurface(self);
  let sequence = toSequence(self);

  if (reality == surface) {
    if (Translator.translate(sequence).further && reality != "\\") {
      Noop;
    } else {
      Complete;
    };
  } else if (init(reality) == surface) {
    // insertion
    let insertedChar = Js.String.substr(~from=-1, reality);
    let sequence' = sequence ++ insertedChar;
    let translation = Translator.translate(sequence');
    switch (translation.symbol) {
    | Some(symbol) =>
      if (insertedChar == symbol && insertedChar == "\\") {
        Stuck(0);
      } else {
        Rewrite({symbol: Some((symbol, sequence')), tail: ""});
      }
    | None =>
      if (translation.further) {
        Insert({...self, tail: self.tail ++ insertedChar});
      } else {
        Stuck(1);
      }
    };
  } else if (reality == init(surface) || reality == init(sequence)) {
    // backspace deletion
    if (String.isEmpty(reality)) {
      // if the symbol is gone
      if (Option.isSome(self.symbol)) {
        // A symbol has just been backspaced and gone
        // replace it with the underlying sequence (backspaced)
        Rewrite({
          symbol: None,
          tail: init(sequence),
        });
      } else {
        Stuck(2);
      };
    } else {
      // normal backspace
      Backspace({...self, tail: init(self.tail)});
    };
  } else {
    Stuck(3);
  };
};
