# CSSKit AST Generation Research

## Overview

CSSKit is a high-performance CSS toolchain written in Rust, inspired by OXC. It generates AST (Abstract Syntax Tree) definitions automatically from W3C CSS specifications using web-features data for browser compatibility.

## How CSSKit Generates AST from Spec

### 1. Spec Fetching and Parsing (`csskit_spec_generator`)

The process starts with the `csskit_spec_generator` crate:

1. **Fetch CSS Specs**: Downloads CSS specifications from `https://drafts.csswg.org/`
   - Example: `https://drafts.csswg.org/css-align-3/`
   - Uses GitHub API to discover available specs: `https://api.github.com/repos/w3c/csswg-drafts/git/trees/main`

2. **Parse HTML**: Uses `scraper` crate to parse the spec HTML
   - Looks for `<table class="propdef">` or `<table class="descdef">`
   - Extracts property definitions from table rows

3. **Extract Property Data**: Parses table rows with `<th>` headers and `<td>` data
   - Key fields: `name`, `value`, `initial`, `applies to`, `inherited`, `percentages`, `animation type`

### 2. Grammar Parsing (`css_value_definition_parser`)

The raw grammar string (e.g., `"normal | <baseline-position> | <content-distribution>"`) is parsed by `css_value_definition_parser`:

```rust
// Example grammar for align-content:
// "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>"

// This gets parsed into a Def AST:
Def::Combinator(
    vec![
        Def::Ident(DefIdent("normal")),
        Def::Type(DefType::new("BaselinePosition", DefRange::None)),
        Def::Type(DefType::new("ContentDistribution", DefRange::None)),
        Def::Combinator(
            vec![
                Def::Type(DefType::new("OverflowPosition", DefRange::None)),
                Def::Type(DefType::new("ContentPosition", DefRange::None)),
            ],
            DefCombinatorStyle::Ordered,
        ),
    ],
    DefCombinatorStyle::Alternatives,
)
```

**Key Parsing Features**:

- Supports CSS value definition syntax: `< >`, `|`, `||`, `&&`, `[]`, `*`, `+`, `{}`, `?`
- Optimizes common patterns (e.g., `auto | <X>` → `AutoOr<X>`)
- Handles multipliers and ranges

### 3. Code Generation (`csskit_spec_generator` → `codegen.rs`)

The `Def` AST is used to generate Rust code:

1. **Determine Type Structure**:
   - `Def::Combinator(Alternatives)` → `Enum`
   - Other combinators → `Struct`

2. **Generate Type Definition**:
   - Creates Rust type with `#[derive(Parse, Peek, ...)]` attributes
   - Adds `#[syntax(...)]` attribute with the original grammar string
   - Includes metadata (initial value, inherits, etc.)

3. **Write to File**: Outputs to `crates/css_ast/src/values/{spec_name}/mod.rs`

### 4. Derive Macros (`csskit_derives`)

The `#[derive(Parse)]` macro generates parsing logic:

- For **enums**: Generates `match` arms for each variant
- For **structs**: Generates sequential field parsing

## Web-Features Integration

CSSKit uses the [web-features](https://github.com/web-platform-dx/web-features) project for browser compatibility data:

### Data Sources

1. **Web Features Data**: Fetched from `https://github.com/web-platform-dx/web-features/releases/latest/download/data.extended.json`
   - Provides feature names, descriptions, browser support, and baseline status
   - Used to generate `css_feature_data` crate with browser compatibility information

2. **CSS Popularity Data**: Fetched from `https://chromestatus.com/data/csspopularity`
   - Provides usage percentages for CSS properties
   - Used for feature prioritization

3. **W3C CSS Specs**: Fetched from `https://drafts.csswg.org/`
   - Provides property definitions and grammar
   - Used to generate AST type definitions

### Web-Features Usage in Code Generation

The `web-features` data is used to:

1. **Generate Feature Metadata**:

   ```rust
   // crates/csskit_spec_generator/src/codegen.rs
   fn generate_feature_entry_tokens(
       id: &str,
       feature_id: &str,
       feature: &FeatureData,
       compat_status: &CompatKeyStatus,
       // ...
   )
   ```

2. **Extract Property Descriptions**:
   - Maps CSS property names to descriptions from web-features
   - Example: `css.properties.align-content` → description text

3. **Browser Support Data**:
   - Baseline status (high/low/false)
   - Support data for Chrome, Firefox, Safari, Edge
   - CanIUse references

### Generated Output

The web-features data generates:

- `crates/css_feature_data/src/data.rs`: Static feature database
- Property descriptions in AST type documentation
- Browser support information

## Example: `align-content`

### Spec Grammar

```
normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>
```

### Generated Rust Code

```rust
// crates/css_ast/src/values/align/mod.rs

#[syntax(" normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ")]
#[derive(Parse, Peek, ToSpan, ToCursors, DeclarationMetadata, SemanticEq, Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[declaration_metadata(
    initial = "normal",
    applies_to = Unknown,
    animation_type = Discrete,
    shorthand_group = PlaceContent,
    property_group = Align,
    computed_value_type = Unknown,
    canonical_order = "per grammar",
)]
pub enum AlignContentStyleValue {
    Normal,
    BaselinePosition(BaselinePosition),
    ContentDistribution(ContentDistribution),
    ContentPosition {
        overflow: Option<OverflowPosition>,
        position: ContentPosition,
    },
}
```

## Architecture

### File Structure

```
csskit/
├── crates/
│   ├── csskit_spec_generator/    # Generates AST from specs
│   │   ├── src/
│   │   │   ├── main.rs           # CLI entry point
│   │   │   ├── spec_parser.rs    # Parses spec HTML
│   │   │   ├── codegen.rs        # Generates Rust code
│   │   │   ├── web_features_data.rs  # Web-features data structures
│   │   │   └── fetch_cached.rs   # Fetches web-features data
│   │   └── Cargo.toml
│   ├── css_value_definition_parser/  # Parses CSS grammar strings
│   │   └── src/lib.rs
│   ├── css_ast/                  # Generated AST definitions
│   │   └── src/values/
│   │       └── {spec}/
│   │           ├── mod.rs        # Type definitions
│   │           └── impls.rs      # Tests
│   ├── csskit_derives/           # Derive macros
│   │   └── src/parse.rs          # Parse derive macro
│   └── css_feature_data/         # Browser compatibility data
│       └── src/data.rs           # Generated from web-features
```

### Key Components

1. **`csskit_spec_generator`**:
   - Fetches and parses CSS specs
   - Fetches web-features data for browser compatibility
   - Generates type definitions
   - Uses `reqwest` for HTTP, `scraper` for HTML parsing

2. **`css_value_definition_parser`**:
   - Recursive descent parser for CSS value grammar
   - Produces `Def` enum representing the grammar structure

3. **`csskit_derives`**:
   - Proc macros for parsing, peeking, visiting, etc.
   - Generates implementation code from type definitions

4. **`css_feature_data`**:
   - Static database of CSS features from web-features
   - Provides browser support and baseline status

## Usage

### Generate All Specs

```bash
cargo run --bin csskit_spec_generator -- generate-all
```

### Generate Specific Spec

```bash
cargo run --bin csskit_spec_generator -- generate-spec css-align
```

### List Available Specs

```bash
cargo run --bin csskit_spec_generator -- list
```

### Generate Feature Data

```bash
cargo run --bin csskit_spec_generator -- generate-feature-data
```

## Testing

Tests are located in `impls.rs` files alongside type definitions:

```rust
// crates/css_ast/src/values/align/impls.rs

#[test]
fn test_writes() {
    assert_parse!(CssAtomSet::ATOMS, AlignContentStyleValue, "normal");
    assert_parse!(CssAtomSet::ATOMS, AlignContentStyleValue, "safe flex-end");
    assert_parse!(CssAtomSet::ATOMS, AlignContentStyleValue, "flex-end");
}
```

## Limitations and Notes

1. **Manual Overrides**: Some properties have custom parsing logic:
   - `ignore_properties.toml`: Properties to skip
   - `manual_parse_properties.toml`: Properties with custom parsing
   - `todo_properties.toml`: Properties marked as todo
   - `shorthands.toml`: Shorthand property mappings

2. **Performance**: Uses `bumpalo` for arena allocation in parsing

3. **Caching**: Web-features data is cached for 24 hours to avoid repeated downloads

## References

- **CSSKit Repository**: https://github.com/csskit/csskit
- **Documentation**: https://csskit.rs
- **Web-Features Repository**: https://github.com/web-platform-dx/web-features
- **Web-Features README**: https://github.com/web-platform-dx/web-features/blob/main/packages/web-features/README.md
- **W3C CSS Specs**: https://drafts.csswg.org/
- **Chrome Status CSS Popularity**: https://chromestatus.com/data/csspopularity
