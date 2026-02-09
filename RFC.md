RFC: Dynamic Styles API for css-in-ts
Status
Draft | Open for Comments
References
- css-variants (https://github.com/timphandev/css-variants) - Type-safe variant library (~1KB, 3-11x faster than CVA)
- valibot (https://github.com/open-circle/valibot) - Modular, type-safe schema validation approach
- vanilla-extract/recipes (https://vanilla-extract.style/documentation/packages/recipes/) - Multi-variant style API
- CVA (Class Variance Authority) (https://cva.style/) - Inspiration for variant API
Motivation
Current css-in-ts only supports static styles at compile-time. To compete with vanilla-extract and StyleX, we need:
1. Runtime/dynamic styles - CSS variables for theme switching, opacity, animations
2. Variant system - Type-safe prop-based styling (like CVA/css-variants)
3. Slot variants - Multi-element component styling
Proposal
import { style, cv, sv, dynamic, styleVar, cx } from 'css-in-ts';
// === STATIC STYLE ===
// Zero-runtime, compile-time extracted
const button = style('button', {
  padding: '12px 24px',
  borderRadius: '6px',
});
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
Type Inference
// Inferred from cv() definition
type ButtonVariant = Parameters<typeof buttonVariant>[0>;
// { color?: 'primary' | 'secondary' | 'danger'; size?: 'sm' | 'md' | 'lg'; state?: 'disabled' | 'loading' }
// Inferred from sv() definition
type CardVariant = Parameters<typeof cardVariant>[0];
// { theme?: 'light' | 'dark'; elevation?: 'none' | 'low' | 'high' }
CSS Output Example
For buttonVariant, the compiler generates:
/* Atomic base styles */
.Button_Button_padding__hash { padding: 12px 24px; }
.Button_Button_borderRadius__hash { border-radius: 6px; }
/* Color variants */
.Button_Button_color_primary__hash { background-color: blue; color: white; }
.Button_Button_color_secondary__hash { background-color: gray; color: black; }
.Button_Button_color_danger__hash { background-color: red; color: white; }
/* Size variants */
.Button_Button_size_sm__hash { font-size: 14px; padding: 8px 16px; }
.Button_Button_size_md__hash { font-size: 16px; padding: 12px 24px; }
.Button_Button_size_lg__hash { font-size: 18px; padding: 16px 32px; }
/* Compound variants */
.Button_Button_compound_0__hash { animation: pulse; }
.Button_Button_compound_1__hash { opacity: 0.75; }
API Reference
cv(options) - Class Variants
interface CvOptions<T extends StyleObject> {
  base?: T;
  variants: {
    [variantName: string]: {
      [valueName: string]: T;
    };
  };
  compoundVariants?: Array<{
    [variantName: string]: string | boolean;
    className?: string;
  }>;
  defaultVariants?: Record<string, string | boolean>;
}
function cv<T>(options: CvOptions<T>): CvReturn<T>
sv(options) - Slot Variants
interface SvOptions {
  slots: string[];
  base: Record<string, StyleObject>;
  variants?: Record<string, Record<string, Record<string, StyleObject>>>;
  compoundVariants?: Array<{
    [variantName: string]: string | boolean;
    classNames?: Record<string, string>;
  }>;
}
function sv(options: SvOptions): SvReturn
styleVar(name) - CSS Variable
function styleVar(name: string): string
// Returns: var(--{hash}_{name})
dynamic(name, vars) - Dynamic Styles
interface DynamicVars {
  [key: string]: () => string | number | ((props: any) => string | number);
}
function dynamic(name: string, vars: DynamicVars): string
// Returns className, vars are set via style prop
Implementation Plan
| Phase | Feature | Files |
|-------|---------|-------|
| 1 | styleVar() - CSS variable creation | src/api.ts, src/types.ts |
| 2 | cv() - Class variants | src/api.ts |
| 3 | sv() - Slot variants | src/api.ts |
| 4 | dynamic() - Runtime styles | src/api.ts |
| 5 | Type inference utilities | src/types.ts |
| 6 | Plugin integration (oxc) | src/oxc-plugin.ts |
| 7 | Tests | src/__tests__/variants.test.ts |
| 8 | Documentation | docs/variants.md |
Open Questions
1. Slot naming - sv() or slots() for the function name?
2. Compound variants syntax - className vs class (css-variants uses className)?
3. Boolean variants - Should we support boolean shorthand? { primary: true } vs { primary: {} }
4. Responsive variants - Include from start or defer?
5. Default export - Should we export a default instance like cv or require named imports?
6. Dynamic props - How should dynamic() handle function props? (props) => value or just references?
Trade-offs Considered
| Approach | Pros | Cons |
|----------|------|------|
| This RFC | Type-safe, composable, atomic CSS output | More complex API |
| CVA/css-variants | Proven, popular | Tailwind-specific naming |
| StyleX functions | Simple syntax | No type-safe variants |
| Vanilla-extract recipes | Full features | Larger bundle |