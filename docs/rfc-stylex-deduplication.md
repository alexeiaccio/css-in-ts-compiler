# RFC: StyleX-Inspired Deduplication and Order Preservation

## Metadata
- **Status**: Proposal
- **Created**: February 13, 2026
- **Author**: css-in-ts-compiler Team
- **Type**: Architecture

## Abstract

This RFC proposes implementing StyleX-inspired deduplication and responsive variant strategies for the css-in-ts-compiler project. StyleX, developed by Meta, achieves up to 80% CSS size reduction through collision-free atomic CSS generation while maintaining deterministic style order through a scoring system.

## Motivation

The current css-in-ts-compiler implementation lacks:
1. **Deduplication** - Multiple `style()` calls with the same properties can generate duplicate CSS rules
2. **Order unpredictability** - CSS specificity issues can arise when class order is not preserved
3. **Large CSS bundles** - Redundant styles increase bundle size and affect performance

StyleX's approach addresses these issues by:
- Using a global style registry to track generated classes
- Implementing deterministic class scoring and sorting
- Preserving order of atomic classes (specificity → pseudo-classes → responsive)

## Proposed Solution

### 1. Variant-Based Style System

Instead of just merging properties, implement a **variant system**:

```typescript
// Variant types
type Variant<T> = {
  name: string;
  styles: CSSProperties;
};

// Create variant function
export function variant<T>(
  name: string,
  styles: CSSProperties
): Variant<T> {
  return { name, styles };
}

// Compose variants (like stylex.variants())
export function variants<T>(
  ...variants: Variant<T>[]
): Record<string, CSSProperties> {
  const result: Record<string, CSSProperties> = {};
  
  for (const v of variants) {
    result[v.name] = v.styles;
  }
  
  return result;
}

// Usage in components
const buttonVariants = variants(
  variant('primary', { backgroundColor: 'blue' }),
  variant('secondary', { backgroundColor: 'green' })
);

const styles = cx(
  buttonVariants.primary,  // Merges into ONE class
  css.md(css.pl("8ch"))    // Responsive variant - SEPARATE class
);
```

### 2. Responsive Variant System

For responsive styles, generate **separate class names** at different breakpoints:

```typescript
// Responsive variant generator
export function responsiveVariant(
  base: CSSProperties,
  breakpoints: Record<string, CSSProperties>
): string {
  // Generate unique class for each breakpoint
  const breakpointKeys = Object.keys(breakpoints);
  const className = breakpointKeys
    .map(bp => `css-${bp}-${hash(JSON.stringify(breakpoints[bp]))}`)
    .join(' ');
  
  return className;
}

// Usage
const styles = responsiveVariant(
  { padding: css.p(2) },          // Base styles
  {                                    // Mobile breakpoint
    '@media (min-width: 640px)': {
      padding: css.md(css.pl("8ch"))  // SEPARATE class!
    }
  }
);
```

### 3. Global Style Registry

Implement a global style registry to track all generated atomic classes:

```typescript
// In compiler.ts
const globalClassRegistry = new Map<string, {
  properties: CSSProperties;
  className: string;
}>();

export function style(
  name: string,
  properties: CSSProperties
): string {
  // Check if exact same properties exist
  const key = Object.entries(properties)
    .map(([k, v]) => `${k}:${v}`)
    .sort()
    .join('|');
  
  if (globalClassRegistry.has(key)) {
    return globalClassRegistry.get(key)!.className;
  }
  
  // Generate new class
  const className = `css-${hash(key)}`;
  
  // Register in global registry
  globalClassRegistry.set(key, { properties, className });
  return className;
}
```

### 4. Order Preservation System

Implement deterministic scoring for class ordering:

```typescript
// Priority scores (higher = more important)
const PRIORITY_SCORES = {
  pseudo: 100,      // &hover, &:focus, etc.
  specificity: 50,   // Specific properties like display: flex
  responsive: 10,     // Media queries
  regular: 1,        // Standard properties
};

function scoreStyle(properties: CSSProperties): number {
  let score = 0;
  
  // Higher score for pseudo-classes
  for (const key in properties) {
    if (key.startsWith('&')) score += PRIORITY_SCORES.pseudo;
  }
  
  // Higher score for display: flex
  if (properties.display === 'flex') score += PRIORITY_SCORES.specificity;
  
  // Higher score for responsive
  for (const key in properties) {
    if (key.startsWith('@media')) score += PRIORITY_SCORES.responsive;
  }
  
  return score;
}

// When merging styles, sort by score (descending)
const merged = {
  ...styles1,      // Lower score (first defined)
  ...styles2,       // Higher score (last defined)
};
```

### 5. Pseudo-Class Support

StyleX handles pseudo-classes (`&:hover`, `&:focus`) by nesting them in the style object:

```typescript
// Support pseudo-classes as separate entries
export function hover(styles: CSSProperties): CSSProperties {
  return { '&:hover': styles };
}

export function focus(styles: CSSProperties): CSSProperties {
  return { '&:focus': styles };
}

// Allow composing: `hover(flex(), color('red'))`
```

## Implementation Details

### Phase 1: Basic Registry (MVP)

1. Add `globalClassRegistry` Map to track all generated classes
2. Modify `style()` function to check registry before generating new classes
3. No scoring system - first-come, first-served

### Phase 2: Order Preservation

1. Implement `scoreStyle()` function to calculate priority scores
2. When merging multiple styles, sort by score (descending)
3. Ensure last defined style takes precedence

### Phase 3: Variant System

1. Add `variant()` and `variants()` functions
2. Add `responsiveVariant()` function for breakpoint-specific classes
3. Support composing variants: `cx(variants.primary(), variants.secondary())`

### Phase 4: Pseudo-Class Support

1. Add helper functions: `hover()`, `focus()`, `active()`, etc.
2. Allow composing: `hover(flex(), color('red'))`

## Benefits

1. **Reduced CSS Size**: Deduplication eliminates redundant rules (up to 80% reduction)
2. **Predictable Ordering**: Deterministic class names prevent specificity wars
3. **Better Performance**: Fewer unique classes = faster parsing
4. **Debuggability**: Global registry makes it easy to inspect generated classes
5. **Variant System**: Better support for component states and responsive designs

## Alternatives Considered

1. **Inline Styles**: Continue with current approach (no deduplication)
   - Pros: Simple, explicit, no runtime overhead
   - Cons: Duplicate rules, unpredictable order

2. **CSS Modules**: Use CSS @layer for grouping
   - Pros: Native CSS feature, explicit scoping
   - Cons: Not compatible with all build tools, adds complexity

3. **CSS-in-JS Libraries**: Use existing libraries (styled-components, emotion)
   - Pros: Battle-tested, ecosystem support
   - Cons: Additional runtime, larger bundle size

## Open Questions

1. Should we implement a full variant system like StyleX or start with basic deduplication?
2. Should responsive styles be in separate class names or merged into one?
3. Should we support pseudo-classes as nested objects or as separate functions?
4. How should we handle conflicts when merging styles with different property combinations?
5. Should the global registry persist across builds or be runtime-only?

## Next Steps

1. Implement Phase 1 (Basic Registry)
2. Test with example components
3. Implement Phase 2 (Order Preservation) if needed
4. Gather feedback from team
5. Consider Phase 3 (Variant System)

## File Location

`/Users/a.tukachev/github/css-in-ts-compiler/docs/rfc-stylex-deduplication.md`

The RFC includes open questions for team discussion and next steps for implementation.
