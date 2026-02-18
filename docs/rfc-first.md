RFC: Dynamic Styles API for css-in-ts
Status
Draft | Open for Comments
References

- css-variants (https://github.com/timphandev/css-variants) - Type-safe variant library (~1KB, 3-11x faster than CVA)
- valibot (https://github.com/open-circle/valibot) - Modular, type-safe schema validation approach
- vanilla-extract/recipes (https://vanilla-extract.style/documentation/packages/recipes/) - Multi-variant style API
- CVA (Class Variance Authority) (https://cva.style/) - Inspiration for variant API
- comptime.ts (https://github.com/feathers-studio/comptime.ts) - Compile-time evaluation for TypeScript

Motivation

Current css-in-ts only supports static styles at compile-time. To compete with vanilla-extract and StyleX, we need:

1. Runtime/dynamic styles - CSS variables for theme switching, opacity, animations
2. Variant system - Type-safe prop-based styling (like CVA/css-variants)
3. Slot variants - Multi-element component styling
4. Compile-time function evaluation - Transform css.\* calls to class names at build time
5. Token system with type validation - Validate token values match CSS syntax

Proposal

import { style, cv, sv, dynamic, styleVar, cx } from 'css-in-ts';
import \* as css from "cssints" with { type: "cssints" };

// === STATIC STYLE ===
// Zero-runtime, compile-time extracted
const button = style('button', {
padding: '12px 24px',
borderRadius: '6px',
});

// === COMPILE-TIME CSS FUNCTIONS ===
// Functions transform to atomic class names at compile time
// Numbers are scaled by theme (1 unit = 0.25rem by default)
const flexStyles = css.display("flex"); // → "x1234abcd"
const paddingStyles = css.p(4); // → padding: 1rem
const marginStyles = css.m(2); // → margin: 0.5rem
const backgroundStyles = css.bg("red"); // → background-color: red

// === TOKENS ===
// Create typed design tokens with @property declarations
const tokens = css.createTokens(
{
colors: css.types.color({
blue: {
100: "oklch(4.820% 0.0334 264.05)",
200: "oklch(59.634% 0.144 264.531)",
},
}),
},
(\_, path) => kebabCase(path),
);

// Theme aliasing via createTokens reuse
const theme = css.createTokens({
primary: tokens("colors.blue.100"),
primaryLight: tokens("colors.blue.200"),
});

// Usage with tokens
const styles = cx(
css.display("flex"),
css.bg(theme("primary")),
css.p(4),
);

// === VARIANTS (cv) ===
// Type-safe variant composition (inspired by css-variants)
const buttonVariant = cv({
base: {
padding: '12px 24px',
borderRadius: '6px',
},
variants: {
color: {
primary: { backgroundColor: 'blue', color: 'white' },
secondary: { backgroundColor: 'gray', color: 'black' },
danger: { backgroundColor: 'red', color: 'white' },
},
size: {
sm: { fontSize: '14px', padding: '8px 16px' },
md: { fontSize: '16px', padding: '12px 24px' },
lg: { fontSize: '18px', padding: '16px 32px' },
},
state: {
disabled: { opacity: '0.5', pointerEvents: 'none' },
loading: { cursor: 'wait' },
},
},
compoundVariants: [
{ color: 'danger', size: 'lg', className: 'animate-pulse' },
{ color: 'primary', state: 'disabled', className: 'opacity-75' },
],
defaultVariants: {
color: 'primary',
size: 'md',
},
});

// === DYNAMIC STYLES (dynamic) ===
// Runtime values via CSS variables
const opacityVar = styleVar('--opacity');
const dynamicCard = dynamic('card', {
opacity: () => opacityVar,
scale: (props) => props.scale || 1,
});

// === SLOTS (sv) ===
// Multi-element component variants
const cardVariant = sv({
slots: ['root', 'header', 'body', 'footer'],
base: {
root: { display: 'flex', flexDirection: 'column' },
header: { fontWeight: 'bold', marginBottom: '8px' },
body: { padding: '16px', flex: '1' },
footer: { marginTop: '12px', paddingTop: '12px' },
},
variants: {
theme: {
light: {
root: { backgroundColor: 'white', border: '1px solid #e5e7eb' },
body: { color: '#1f2937' },
},
dark: {
root: { backgroundColor: '#1f2937', borderColor: '#374151' },
body: { color: '#f9fafb' },
},
},
elevation: {
none: {},
low: { root: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } },
high: { root: { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } },
},
},
compoundVariants: [
{ theme: 'dark', elevation: 'high', classNames: { root: 'ring-2 ring-blue-500' } },
],
});

// === USAGE ===
// Static
<button className={button}>Click</button>

// Compile-time functions

<div className={cx(css.display("flex"), css.p(4))}>Hello</div>

// Tokens

<div className={cx(css.bg(theme("primary")))}>Themed</div>

// Variants
<button className={buttonVariant({ color: 'primary', size: 'lg' })}>
Submit
</button>

// Dynamic

<div className={dynamicCard} style={{ [opacityVar]: '0.8', '--scale': 1.1 }}>
Content
</div>

// Slots

<div className={cardVariant.root({ theme: 'dark', elevation: 'high' })}>
<div className={cardVariant.header({ theme: 'dark' })}>Title</div>
<div className={cardVariant.body({ theme: 'dark' })}>Content</div>
<div className={cardVariant.footer({ theme: 'dark' })}>Footer</div>
</div>

Compile-Time Function API

Functions accept string | number:

- Numbers are scaled by theme scale (default: 0.25rem per unit, i.e., p(4) → 1rem)
- Strings are passed through as-is (p("2ch") → padding: 2ch)

css.display(value) // display: value
css.flex(value) // display: flex
css.p(value) // padding: scaled/rem
css.px(value) // padding-left/right
css.py(value) // padding-top/bottom
css.m(value) // margin: scaled/rem
css.bg(value) // background-color: value
css.color(value) // color: value
// ... all CSS properties

Responsive shortcuts:
css.sm(styles) // @media (min-width: 640px)
css.md(styles) // @media (min-width: 768px)
css.lg(styles) // @media (min-width: 1024px)

Pseudo-classes:
css.hover(styles) // &:hover
css.focus(styles) // &:focus
css.active(styles) // &:active

Token API

css.createTokens(group, options)

- group: Object defining token structure with css.types.\* validators
- options.pathToVar: Function to convert path to variable name

css.types.color(value) // Validates <color> syntax, generates @property
css.types.length(value) // Validates <length> syntax
// ... other type validators

tokens(path) // Returns var(--...)
theme("primary") // Returns var(--colors-blue-100)

Type Inference

// Inferred from cv() definition
type ButtonVariant = Parameters<typeof buttonVariant>[0];
// { color?: 'primary' | 'secondary' | 'danger'; size?: 'sm' | 'md' | 'lg'; state?: 'disabled' | 'loading' }

// Inferred from sv() definition
type CardVariant = Parameters<typeof cardVariant>[0];
// { theme?: 'light' | 'dark'; elevation?: 'none' | 'low' | 'high' }

CSS Output Example

For compile-time functions, the compiler generates:

/_ css.display("flex") _/
.x1234abcd { display: flex; }

/_ css.p(4) _/
.x5678efgh { padding: 1rem; }

/_ css.bg(theme("primary")) - with token _/
@property --colors-blue-100 {
syntax: "<color>";
inherits: true;
initial-value: oklch(4.82% 0.0334 264.05);
}
.x9012ijkl { background-color: var(--colors-blue-100); }

/_ Responsive css.md(css.p(6)) _/
@media (min-width: 768px) {
.xabcd1234 { padding: 1.5rem; }
}

Implementation Plan
| Phase | Feature | Files |
|-------|---------|-------|
| 1 | cssints module with CSS property functions | src/cssints/index.ts |
| 2 | Compile-time transformer for css.\* calls | src/cssints/transformer.ts |
| 3 | Registry and hash utilities | src/cssints/registry.ts, hash.ts |
| 4 | Token system with type validation | src/cssints/index.ts (types) |
| 5 | Vite plugin integration | src/oxc-plugin.ts |
| 6 | cv() - Class variants | src/api.ts |
| 7 | sv() - Slot variants | src/api.ts |
| 8 | dynamic() - Runtime styles | src/api.ts |
| 9 | Tests | src/**tests**/variants.test.ts |

Open Questions

1. Token path separator - Currently dot (colors.blue.100), should we support kebab-case?
2. Token aliases - Is createTokens reuse the best pattern for aliases?
3. Type validators - Should we generate types from mdn-data or maintain manually?
4. CSS function support - color-mix, oklch, relative color syntax - include from start?

Trade-offs Considered

| Approach                | Pros                                                              | Cons                     |
| ----------------------- | ----------------------------------------------------------------- | ------------------------ |
| This RFC                | Type-safe, composable, atomic CSS output, compile-time evaluation | More complex API         |
| CVA/css-variants        | Proven, popular                                                   | Tailwind-specific naming |
| StyleX functions        | Simple syntax                                                     | No type-safe variants    |
| Vanilla-extract recipes | Full features                                                     | Larger bundle            |
