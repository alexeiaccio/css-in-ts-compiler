import { describe, it, expect } from "vitest";
import { Lexer, Token, LexContext } from "../lexer/index.js";

function tokenize(source: string): ReturnType<Lexer["next"]>[] {
  const lexer = new Lexer(source);
  const tokens: ReturnType<Lexer["next"]>[] = [];
  let token;
  while ((token = lexer.next(LexContext.Normal)).token !== Token.EOF) {
    tokens.push(token);
  }
  return tokens;
}

function tokenizeValueDef(source: string): ReturnType<Lexer["next"]>[] {
  const lexer = new Lexer(source);
  const tokens: ReturnType<Lexer["next"]>[] = [];
  let token;
  while ((token = lexer.next(LexContext.ValueDef)).token !== Token.EOF) {
    tokens.push(token);
  }
  return tokens;
}

function t(source: string): ReturnType<Lexer["next"]> {
  const tokens = tokenize(source);
  return tokens[0]!;
}

function tv(source: string): ReturnType<Lexer["next"]> {
  const tokens = tokenizeValueDef(source);
  return tokens[0]!;
}

describe("Lexer - Identifiers", () => {
  it("should tokenize simple identifiers", () => {
    expect(t("foo").token).toBe(Token.Ident);
    expect(t("foo").value).toBe("foo");
  });

  it("should tokenize identifiers with hyphens", () => {
    expect(t("border-color").token).toBe(Token.Ident);
    expect(t("border-color").value).toBe("border-color");
  });

  it("should tokenize identifiers starting with hyphen", () => {
    expect(t("-foo").token).toBe(Token.Ident);
  });

  it("should tokenize identifiers with underscores", () => {
    expect(t("_private").token).toBe(Token.Ident);
  });

  it("should tokenize Unicode identifiers", () => {
    expect(t("café").token).toBe(Token.Ident);
  });
});

describe("Lexer - Keywords", () => {
  it("should tokenize CSS-wide keywords", () => {
    expect(t("inherit").token).toBe(Token.Ident);
    expect(t("inherit").value).toBe("inherit");
  });

  it("should tokenize initial and unset", () => {
    expect(t("initial").value).toBe("initial");
    expect(t("unset").value).toBe("unset");
    expect(t("revert").value).toBe("revert");
    expect(t("revert-layer").value).toBe("revert-layer");
  });
});

describe("Lexer - Numbers", () => {
  it("should tokenize integers", () => {
    expect(t("42").token).toBe(Token.Number);
    expect(t("42").value).toBe("42");
  });

  it("should tokenize decimals", () => {
    expect(t("3.14").token).toBe(Token.Number);
    expect(t("3.14").value).toBe("3.14");
  });

  it("should tokenize negative numbers", () => {
    expect(t("-10").token).toBe(Token.Number);
    expect(t("-10").value).toBe("-10");
  });

  it("should tokenize numbers with exponent", () => {
    expect(t("1e5").token).toBe(Token.Number);
    expect(t("1e5").value).toBe("1e5");
  });

  it("should tokenize negative exponent", () => {
    expect(t("1e-5").token).toBe(Token.Number);
    expect(t("1e-5").value).toBe("1e-5");
  });
});

describe("Lexer - Dimensions", () => {
  it("should tokenize pixel dimension", () => {
    expect(t("10px").token).toBe(Token.Dimension);
    expect(t("10px").value).toBe("10px");
  });

  it("should tokenize em dimension", () => {
    expect(t("1.5em").token).toBe(Token.Dimension);
  });

  it("should tokenize percentage", () => {
    expect(t("50%").token).toBe(Token.Percentage);
    expect(t("50%").value).toBe("50%");
  });

  it("should tokenize negative dimension", () => {
    expect(t("-20px").token).toBe(Token.Dimension);
  });
});

describe("Lexer - Functions", () => {
  it("should tokenize rgb()", () => {
    const tokens = tokenize("rgb(255, 0, 0)");
    expect(tokens[0]!.token).toBe(Token.Function);
    expect(tokens[0]!.value).toBe("rgb");
    expect(tokens[0]!.name).toBe("rgb");
  });

  it("should tokenize calc()", () => {
    const tokens = tokenize("calc(100% - 20px)");
    expect(tokens[0]!.token).toBe(Token.Function);
  });

  it("should tokenize var()", () => {
    const tokens = tokenize("var(--color)");
    expect(tokens[0]!.token).toBe(Token.Function);
  });
});

describe("Lexer - At-keywords", () => {
  it("should tokenize @media", () => {
    expect(t("@media").token).toBe(Token.AtKeyword);
    expect(t("@media").value).toBe("@media");
    expect(t("@media").name).toBe("media");
  });

  it("should tokenize @import", () => {
    expect(t("@import").token).toBe(Token.AtKeyword);
    expect(t("@import").name).toBe("import");
  });

  it("should tokenize @keyframes", () => {
    expect(t("@keyframes").token).toBe(Token.AtKeyword);
    expect(t("@keyframes").name).toBe("keyframes");
  });
});

describe("Lexer - Delimiters", () => {
  it("should tokenize comma", () => {
    expect(t(",").token).toBe(Token.Comma);
  });

  it("should tokenize colon", () => {
    expect(t(":").token).toBe(Token.Colon);
  });

  it("should tokenize semicolon", () => {
    expect(t(";").token).toBe(Token.Semicolon);
  });

  it("should tokenize brackets", () => {
    expect(t("(").token).toBe(Token.LeftParen);
    expect(t(")").token).toBe(Token.RightParen);
    expect(t("[").token).toBe(Token.LeftBracket);
    expect(t("]").token).toBe(Token.RightBracket);
    expect(t("{").token).toBe(Token.LeftBrace);
    expect(t("}").token).toBe(Token.RightBrace);
  });
});

describe("Lexer - Value Definition Combinators", () => {
  it("should tokenize single bar", () => {
    expect(tv("|").token).toBe(Token.Bar);
    expect(tv("|").value).toBe("|");
  });

  it("should tokenize double bar", () => {
    expect(tv("||").token).toBe(Token.DoubleBar);
    expect(tv("||").value).toBe("||");
  });

  it("should tokenize double ampersand", () => {
    expect(tv("&&").token).toBe(Token.DoubleAmp);
    expect(tv("&&").value).toBe("&&");
  });
});

describe("Lexer - Value Definition Multipliers", () => {
  it("should tokenize asterisk", () => {
    expect(tv("*").token).toBe(Token.Asterisk);
  });

  it("should tokenize plus", () => {
    expect(tv("+").token).toBe(Token.Plus);
  });

  it("should tokenize question mark", () => {
    expect(tv("?").token).toBe(Token.QuestionMark);
  });

  it("should tokenize hash mark", () => {
    expect(tv("#").token).toBe(Token.HashMark);
  });

  it("should tokenize exclamation mark", () => {
    expect(tv("!").token).toBe(Token.ExclamationMark);
  });
});

describe("Lexer - Strings", () => {
  it("should tokenize double-quoted strings", () => {
    expect(t('"hello"').token).toBe(Token.String);
    expect(t('"hello"').value).toBe("hello");
  });

  it("should tokenize single-quoted strings", () => {
    expect(t("'world'").token).toBe(Token.String);
  });
});

describe("Lexer - Comments", () => {
  it("should tokenize single-line comments", () => {
    const tokens = tokenize("foo /* comment */ bar");
    expect(tokens).toHaveLength(3);
    expect(tokens[0]!.value).toBe("foo");
    expect(tokens[1]!.token).toBe(Token.Comment);
    expect(tokens[2]!.value).toBe("bar");
  });

  it("should handle multi-line comments", () => {
    const tokens = tokenize("foo /* multi\nline */ bar");
    expect(tokens).toHaveLength(3);
    expect(tokens[1]!.token).toBe(Token.Comment);
  });

  it("should handle comment without content", () => {
    const tokens = tokenize("foo /**/ bar");
    expect(tokens).toHaveLength(3);
    expect(tokens[1]!.token).toBe(Token.Comment);
  });
});

describe("Lexer - Edge Cases", () => {
  it("should handle empty input", () => {
    const tokens = tokenize("");
    expect(tokens).toHaveLength(0);
  });

  it("should handle numbers starting with decimal", () => {
    expect(t(".5").token).toBe(Token.Number);
  });

  it("should handle zero", () => {
    expect(t("0").token).toBe(Token.Number);
  });

  it("should handle CSS-wide keywords with prefix", () => {
    expect(t("my-inherit").token).toBe(Token.Ident);
    expect(t("my-inherit").value).toBe("my-inherit");
  });
});

describe("Lexer - Position tracking", () => {
  it("should track position correctly", () => {
    const tokens = tokenize("foo bar");
    expect(tokens[0]!.pos).toBe(0);
    expect(tokens[0]!.end).toBe(3);
    expect(tokens[1]!.pos).toBe(4);
    expect(tokens[1]!.end).toBe(7);
  });
});
