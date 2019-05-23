open Rebase;

type t = {
  // the symbol at the front of the sequence along with the sequence it replaced
  symbol: option((string, string)),
  // the sequence following the symbol we see on the text editor
  tail: string,
};

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

type action =
  | Noop(t) // should do nothing
  | Rewrite(t) // should rewrite the text buffer
  | Stuck; // should deactivate

// devise the next state
let next = (self, reality) => {
  let surface = toSurface(self);
  let sequence = toSequence(self);

  if (reality == surface) {
    if (Translator.translate(sequence).further && reality != "\\") {
      Noop(self);
    } else {
      Stuck;
    };
  } else if (init(reality) == surface) {
    // insertion
    let insertedChar = Js.String.substr(~from=-1, reality);
    let sequence' = sequence ++ insertedChar;
    let translation = Translator.translate(sequence');
    switch (translation.symbol) {
    | Some(symbol) =>
      if (insertedChar == symbol) {
        if (insertedChar == "\\") {
          Stuck;
        } else {
          Noop({symbol: Some((symbol, sequence')), tail: ""});
        };
      } else {
        Rewrite({symbol: Some((symbol, sequence')), tail: ""});
      }
    | None =>
      if (translation.further) {
        Noop({...self, tail: self.tail ++ insertedChar});
      } else {
        Stuck;
      }
    };
  } else if (reality == init(surface)) {
    // backspace deletion
    if (String.isEmpty(reality)) {
      if (Option.isSome(self.symbol)) {
        // A symbol has just been backspaced and gone
        Rewrite({
          symbol: None,
          tail: init(sequence),
        });
      } else {
        Stuck;
      };
    } else {
      // normal backspace
      Noop({...self, tail: init(self.tail)});
    };
  } else {
    Stuck;
  };
};
