# @cssints/css-syntax

Fast CSS parser using unbash-inspired architecture with Uint8Array for O(1) character classification.

## Features

- **Performance**: O(1) character classification using Uint8Array lookup tables
- **Complete CSS spec support**: Selectors, values, at-rules, media queries
- **Type-safe**: Full TypeScript with Effect TS for error handling
- **Zero dependencies**: Only Effect TS for functional patterns
- **Context-sensitive**: Lexer adapts to parsing context (values, selectors, etc.)
- **CSS spec compliant**: Unicode character rules matching CSS Syntax Level 3

## Installation

```bash
bun add @cssints/css-syntax
```

## Usage

### Lexer

```typescript
import { Lexer, LexContext } from "@cssints/css-syntax/lexer";

const lexer = new Lexer("color: red; background: blue;");
let token;
while ((token = lexer.next(LexContext.Normal)).token !== Token.EOF) {
  console.log(token);
}
```

### Parser

```typescript
import { parseValue, parseValueDef } from "@cssints/css-syntax/parser";
import { Effect } from "effect";

// Parse CSS value
const result = Effect.runSync(parseValue("100px 50% red"));
console.log(result);

// Parse value definition syntax
const syntax = Effect.runSync(parseValueDef("<length> | <percentage> | auto"));
console.log(syntax);
```

### Generator

```typescript
import { generateCSS } from "@cssints/css-syntax/generator";
import type { ValueNode } from "@cssints/css-syntax/ast";

const css = generateCSS(valueNode);
console.log(css); // "100px 50% red"
```

### Walker

```typescript
import { walk } from "@cssints/css-syntax/walker";
import type { SyntaxNode } from "@cssints/css-syntax/ast";

walk(node, {
  enter(node) {
    console.log("Entering:", node._tag);
  },
  leave(node) {
    console.log("Leaving:", node._tag);
  },
  Identifier(node) {
    console.log("Identifier:", node.name);
  }
});
```

## Performance

Benchmarks (preliminary, on M1 Pro):

- **Lexer**: ~2-5x faster than css-tree for tokenization
- **Value parser**: ~2x faster than css-tree's parseValue()
- **Memory**: Single-pass parsing, minimal allocations

See `src/tests/*.test.ts` for test coverage.

## Architecture

### Lexer

- **Uint8Array lookup tables**: O(1) character classification
- **Context-sensitive**: Different tokenization rules for Normal, ValueDef, Selector, etc.
- **CSS spec Unicode rules**: Full support for non-ASCII identifiers

### Parser

- **Recursive descent**: Clear, maintainable parsing logic
- **Combinator precedence**: Proper handling of `|` vs `||` vs `&&` vs juxtaposition
- **Effect TS**: Type-safe error handling

### AST

- **Effect TaggedClass**: Discriminated unions for type safety
- **Immutable**: All AST nodes are readonly
- **Serializable**: JSON-compatible for debugging/testing

## Roadmap

### Phase 1: Lexer + Value Parsing
- [x] Lexer with Uint8Array
- [x] CSS spec Unicode rules
- [x] Value definition syntax parser
- [x] CSS value parser
- [x] Tests + benchmarks

### Phase 2: Declarations & Rules
- [x] Declaration parser
- [x] Rule parser
- [x] At-rule parser (basic)

### Phase 3: Selectors
- [x] Selector parser (Level 4)
- [x] Combinators, pseudo-classes, attributes

### Phase 4: Media Queries & At-Rules
- [x] Media query parser
- [x] Complete at-rule support

### Phase 5: Complete CSS
- [x] Full stylesheet parser
- [x] Generator module
- [x] Walker module

### Phase 6: Future Enhancements
- [x] Property-based testing with FastCheck
- [x] Parallel lexing (Effect.all with concurrency)
- [x] CSS Color Level 4 support
- [x] CSS Container Queries
- [ ] CSS Nesting syntax

## Comparison with css-tree

| Feature | @cssints/css-syntax | css-tree |
|---------|---------------------|----------|
| Tokenization | Uint8Array O(1) | O(n) character checks |
| Performance | 2-5x faster | Baseline |
| CSS spec | CSS Syntax Level 3 | CSS Syntax Level 3 |
| Unicode | Full support | Full support |
| Dependencies | Effect TS only | None |
| TypeScript | First-class | Typings via @types/css-tree |
| Error handling | Effect TS | Throws |

## Development

```bash
# Build
bun run build

# Test
bun run test

# Benchmark
bun run benchmark

# Type-check
bun run typecheck

# Lint
bun run lint
bun run lint:fix
```

## License

MIT
