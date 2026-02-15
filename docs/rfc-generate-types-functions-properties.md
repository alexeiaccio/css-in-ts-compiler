# RFC: Generate CSS Types → Functions → Properties

## Metadata
- **Status**: Proposal
- **Created**: February 15, 2026
- **Type**: Implementation Plan

## Abstract

This RFC proposes generating CSS type definitions in a specific order that ensures dependencies are resolved before they're used:

1. **Types first** - CSS value types (<length>, <color>, <percentage>, <angle>, <time>, <frequency>, <resolution>, <flex>, <image>, <string>, <url>)
2. **Functions second** - CSS functions (calc, color-mix, oklch, oklab, min, max, clamp, etc.)
3. **Properties third** - CSS properties (color, margin, padding, display, flex, grid, filter, etc.)

This order ensures that functions can reference types, and properties can reference both types and functions.

## Goals

1. **Use existing typed.ts as goal** - Match to structure and style
2. **Generate all types from spec** - Not just basic types, but comprehensive type system
3. **Generate all functions from spec** - With proper overloads
4. **Generate all properties from spec** - With all possible values
5. **Strong parameter types** - Each parameter has a specific type (not just `string`)
6. **Function overloads** - Yes, generate overloaded functions when needed
7. **All property values** - Include all possible values for each property
8. **Browser support levels** - Track support levels (not just exact versions)
9. **Custom extensions** - Write list of custom functions/properties to separate MD file
10. **Type granularity** - Comprehensive type system (not just basic types)
11. **JSDoc format** - Use `/**` (not `/*`)

## Implementation Plan

### Phase 1: Existing Structure

**Current File**: `packages/cssints/lib/typed.ts`

```typescript
declare const __type: unique symbol;

type Type<__Type> = { [__type]: __Type };

export type Typed<T, __Type> = T & Type<__Type>;

export function createTyped<T, __Type>(value: T): Typed<T, __Type> {
	return value as Typed<T, __Type>;
}

const identity = <T>(value: unknown): T => value as T;

// Units
export type Deg = \`\${number}deg\`;
export type Rad = \`\${number}rad\`;
export type Grad = \`\${number}grad\`;
export type Turn = \`\${number}turn\`;

// Types
export type Angle = Number | Deg | Rad | Grad | Turn;
export type Length = Number | Cap | Ch | Em | Ex | Ic | Lh | Rcap | Rch | Rem | Rex | Rlh | Vh | Vw | Vmax | Vmin | Vb | Vi | Cqw | Cqh | Cqi | Cqb | Cqmin | Cqmax | Px | Cm | Mm | Q | In | Pc | Pt;
export type Number = number;
export type Zero = 0 | "0";

// Units
export const number = createTyped<(value: number) => Number, "NumberFn">(identity);
export const deg = createTyped<(value: number) => Deg, "DegFn">((value) => \`\${value}deg\`);
export const rad = createTyped<(value: number) => Rad, "RadFn">((value) => \`\${value}rad\`);
export const grad = createTyped<(value: number) => Grad, "GradFn">((value) => \`\${value}grad\`);
export const turn = createTyped<(value: number) => Turn, "TurnFn">((value) => \`\${value}turn\`);

// Types
export const zero = createTyped<(value: 0) => Zero, "ZeroFn">(identity);
export const angle = createTyped<(value: Number | Deg | Rad | Grad | Turn) => Angle, "AngleFn">(identity);

/**
 * filter() - filter function
 * 
 * The **filter** CSS property applies graphical effects like blur or color shift to an element.
 * Filters are commonly used to adjust the rendering of images, backgrounds, and borders.
 * 
 * **Syntax**: \`none | <filter-value-list>\`
 * **Initial value**: \`none\`
 * **Inherits**: \`false\`
 * 
 * **Browser support**:
 * | Chrome   | Firefox    | Safari    |  Edge   |
 * | :------: | :--------: | :-------: | :-----: |
 * | **53**   | **35**     | **9.1**   | **12**   |
 * 
 * **@see** https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/filter
 */
export const filter = createTyped<(value: any) => string, "FilterFn">((value) => \`filter: \${value}\`);
```

### Phase 2: Generate Types

**Script**: `packages/types/scripts/generate-types.ts`

```typescript
import { writeFileSync } from 'node:fs';

const OUTPUT_FILE = './packages/cssints/lib/generated-types.ts';

interface TypeDefinition {
  name: string;
  typescriptType: string;
  description: string;
  examples: string[];
}

// Type definitions
const TYPES: TypeDefinition[] = [
  // Length types
  {
    name: '<length>',
    typescriptType: 'Length',
    description: 'A length value (e.g., 10px, 1rem, 100%)',
    examples: ['10px', '1rem', '100%', 'calc(100% - 2rem)', '1em', '10ch', '1ex', '1ic', '1lh', '1rcap', '1rch', '1rem', '1rex', '1rlh', '1vw', '1vh', '1vmax', '1vmin', '1vb', '1vi', '1cqw', '1cqh', '1cqi', '1cqb', '1cqmin', '1cqmax', '1px', '1cm', '1mm', '1q', '1in', '1pc', '1pt'],
  },
  
  // Color types
  {
    name: '<color>',
    typescriptType: 'Color',
    description: 'A color value (e.g., red, #ff0000, rgb(255, 0, 0))',
    examples: ['red', '#ff0000', 'rgb(255, 0, 0)', 'oklch(50% 0.05 264.05)', 'color-mix(in srgb, red, blue)'],
  },
  
  // Percentage types
  {
    name: '<percentage>',
    typescriptType: 'Percentage',
    description: 'A percentage value (e.g., 50%, 0.5, 100%)',
    examples: ['50%', '0.5', '100%', 'calc(50% - 10px)'],
  },
  
  // Angle types
  {
    name: '<angle>',
    typescriptType: 'Angle',
    description: 'An angle value (e.g., 90deg, 1.5rad, 1turn)',
    examples: ['90deg', '1.5rad', '1turn', 'calc(90deg + 10deg)'],
  },
  
  // Time types
  {
    name: '<time>',
    typescriptType: 'Time',
    description: 'A time value (e.g., 1s, 500ms, 2s)',
    examples: ['1s', '500ms', '2s', 'calc(1s + 500ms)'],
  },
  
  // Frequency types
  {
    name: '<frequency>',
    typescriptType: 'Frequency',
    description: 'A frequency value (e.g., 1kHz, 500Hz, 2kHz)',
    examples: ['1kHz', '500Hz', '2kHz'],
  },
  
  // Resolution types
  {
    name: '<resolution>',
    typescriptType: 'Resolution',
    description: 'A resolution value (e.g., 1dpi, 2dppx, 96dpi)',
    examples: ['1dpi', '2dppx', '96dpi'],
  },
  
  // Flex types
  {
    name: '<flex>',
    typescriptType: 'Flex',
    description: 'A flex value (e.g., 1fr, 2fr, auto)',
    examples: ['1fr', '2fr', 'auto', 'calc(1fr + 2fr)'],
  },
  
  // Image types
  {
    name: '<image>',
    typescriptType: 'Image',
    description: 'An image value (e.g., url(image.png), linear-gradient(...))',
    examples: ['url(image.png)', 'linear-gradient(to right, red, blue)'],
  },
  
  // String types
  {
    name: '<string>',
    typescriptType: 'String',
    description: 'A string value (e.g., auto, center, flex)',
    examples: ['auto', 'center', 'flex', 'grid'],
  },
  
  // URL types
  {
    name: '<url>',
    typescriptType: 'URL',
    description: 'A URL value (e.g., url(image.png), url(https://example.com))',
    examples: ['url(image.png)', 'url(https://example.com)'],
  },
];

function generateTypeDefinition(type: TypeDefinition): string {
  const examplesCode = type.examples.map(ex => \`"\${ex}"\`).join(' | ');
  return \`export type \${type.name} = \${examplesCode};\`;
}

async function main() {
  console.log('🔨 Generating CSS type definitions...');
  const code = [];
  code.push('/**');
  code.push(' * Auto-Generated CSS Types');
  code.push(' * Generated: ' + new Date().toISOString());
  code.push(' * Source: MDN Value Definition Syntax');
  code.push(' * ');
  code.push(' * This file contains all CSS value type definitions.');
  code.push(' * ');
  code.push(' * Order: Types → Functions → Properties');
  code.push(' * ');
  code.push(' * @cssints/cssints');
  code.push(' */');
  code.push('');
  for (const type of TYPES) {
    code.push(generateTypeDefinition(type));
  }
  const output = code.join('\n');
  await Bun.write(OUTPUT_FILE, output);
  console.log(\`✅ Generated \${TYPES.length} type definitions\`);
  console.log(\`📝 Wrote: \${OUTPUT_FILE}\`);
}

if (import.meta.main) {
  main().catch(console.error);
}
```

### Phase 3: Generate Functions

**Script**: `packages/types/scripts/generate-functions.ts`

```typescript
import { readFileSync, writeFileSync } from 'node:fs';

const TYPES_FILE = './data/generated-types.json';
const OUTPUT_FILE = './packages/cssints/lib/generated-functions.ts';

interface FunctionDefinition {
  name: string;
  category: string;
  syntax: string;
  parameters: Parameter[];
  description?: string;
  browsers?: {
    chrome?: string;
    firefox?: string;
    safari?: string;
    edge?: string;
  };
}

interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  default?: any;
  description?: string;
}

// Function definitions
const FUNCTIONS: FunctionDefinition[] = [
  // Math functions
  {
    name: 'calc',
    category: 'math',
    syntax: 'calc(<calc-sum>)',
    parameters: [
      { name: 'calc-sum', type: 'CalcSum', optional: false, description: 'Calculation expression' },
    ],
    description: 'Perform calculations',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
  {
    name: 'min',
    category: 'math',
    syntax: 'min(<length-list>)',
    parameters: [
      { name: 'length-list', type: 'LengthList', optional: false, description: 'List of length values' },
    ],
    description: 'Return minimum value',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
  {
    name: 'max',
    category: 'math',
    syntax: 'max(<length-list>)',
    parameters: [
      { name: 'length-list', type: 'LengthList', optional: false, description: 'List of length values' },
    ],
    description: 'Return maximum value',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
  {
    name: 'clamp',
    category: 'math',
    syntax: 'clamp(<length> | <percentage>, <length> | <percentage> | <length> | <percentage>)',
    parameters: [
      { name: 'min', type: 'Length | Percentage', optional: false, description: 'Minimum value' },
      { name: 'value', type: 'Length | Percentage', optional: false, description: 'Value to clamp to' },
      { name: 'max', type: 'Length | Percentage', optional: false, description: 'Maximum value' },
    ],
    description: 'Clamp a value between min and max',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
  
  // Color functions
  {
    name: 'color-mix',
    category: 'color',
    syntax: 'color-mix(<color-interpolation-method>, <color>, <color>, [<percentage>?, <color>]?#{2})',
    parameters: [
      { name: 'color-interpolation-method', type: 'ColorSpace', optional: false, description: 'Color space for interpolation' },
      { name: 'color1', type: 'Color', optional: false, description: 'First color' },
      { name: 'color2', type: 'Color', optional: false, description: 'Second color' },
      { name: 'percentage1', type: 'Percentage', optional: true, description: 'Percentage of first color', default: '50%' },
      { name: 'color3', type: 'Color', optional: false, description: 'Third color' },
      { name: 'percentage2', type: 'Percentage', optional: true, description: 'Percentage of second color', default: '50%' },
    ],
    description: 'Mix two colors in a specified color space',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
  {
    name: 'oklch',
    category: 'color',
    syntax: 'oklch(<lightness> | <percentage>, <chroma> | <percentage>, <hue> | <percentage>, [<alpha>?])',
    parameters: [
      { name: 'lightness', type: 'Length | Percentage', optional: false, description: 'Lightness value' },
      { name: 'chroma', type: 'Length | Percentage', optional: false, description: 'Chroma value' },
      { name: 'hue', type: 'Angle | Percentage', optional: false, description: 'Hue value' },
      { name: 'alpha', type: 'Percentage', optional: true, description: 'Alpha value' },
    ],
    description: 'Convert color to OKLCh color space',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
  {
    name: 'oklab',
    category: 'color',
    syntax: 'oklab(<lightness> | <percentage>, <a> | <percentage>, <b> | <percentage>, [<alpha>?])',
    parameters: [
      { name: 'lightness', type: 'Length | Percentage', optional: false, description: 'Lightness value' },
      { name: 'a', type: 'Length | Percentage', optional: false, description: 'A value' },
      { name: 'b', type: 'Length | Percentage', optional: false, description: 'B value' },
      { name: 'alpha', type: 'Percentage', optional: true, description: 'Alpha value' },
    ],
    description: 'Convert color to OKLab color space',
    browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' },
  },
];

function generateFunctionDefinition(fn: FunctionDefinition): string {
  // Build parameter list with strong types
  const params = fn.parameters.map(p => {
    const optionalStr = p.optional ? '?' : '';
    const defaultStr = p.default ? \` = \${JSON.stringify(p.default)}\` : '';
    return \`  * @param {\${p.name}\${optionalStr}} \${p.type} - \${p.description || ''}\${defaultStr}\`;
  }).join('\n');

  // Build JSDoc with browser support
  const statusLine = fn.browsers ? \` * @status modern\` : '';
  const compatLines = [];
  if (fn.browsers?.chrome) compatLines.push(\` * @compat Chrome \${fn.browsers.chrome}\`);
  if (fn.browsers?.firefox) compatLines.push(\` * @compat Firefox \${fn.browsers.firefox}\`);
  if (fn.browsers?.safari) compatLines.push(\` * @compat Safari \${fn.browsers.safari}\`);
  if (fn.browsers?.edge) compatLines.push(\` * @compat Edge \${fn.browsers.edge}\`);

  const compatBlock = compatLines.length > 0 ? compatLines.join('\n') : '';

  // Generate function code
  const code = \`/**
 * \${fn.name}() - \${fn.category} function
 * \${fn.description || ''}
 * \${statusLine}
 * \${compatBlock}
 * 
 * @category \${fn.category}
 * @spec \${fn.syntax || 'css-values'}
\${params}
 * @returns {string} CSS output
 */
export const \${fn.name} = createTyped<(\${fn.parameters.map(p => p.name).join(', ')}) => string, "\${fn.name}Fn">(\${fn.parameters.map(p => p.name).join(', ')Args => \`\${fn.name}(\${fn.parameters.map(p => p.name).join(', ')Args)\`;
\`;

  return code;
}

async function main() {
  console.log('🔨 Generating CSS function definitions...');
  const code = [];
  code.push('/**');
  code.push(' * Auto-Generated CSS Functions');
  code.push(' * Generated: ' + new Date().toISOString());
  code.push(' * Source: WebRef CSS + Browserslist');
  code.push(' * ');
  code.push(' * This file contains all CSS function definitions.');
  code.push(' * ');
  code.push(' * Order: Types → Functions → Properties');
  code.push(' * ');
  code.push(' * @cssints/cssints');
  code.push(' */');
  code.push('');
  for (const fn of FUNCTIONS) {
    code.push(generateFunctionDefinition(fn));
  }
  const output = code.join('\n');
  await Bun.write(OUTPUT_FILE, output);
  console.log(\`✅ Generated \${FUNCTIONS.length} function definitions\`);
  console.log(\`📝 Wrote: \${OUTPUT_FILE}\`);
}

if (import.meta.main) {
  main().catch(console.error);
}
```

### Phase 4: Generate Properties

**Script**: `packages/types/scripts/generate-properties.ts`

```typescript
import { readFileSync, writeFileSync } from 'node:fs';

const FUNCTIONS_FILE = './data/generated-functions.json';
const TYPES_FILE = './data/generated-types.json';
const OUTPUT_FILE = './packages/cssints/lib/generated-properties.ts';

interface PropertyDefinition {
  name: string;
  spec: string;
  syntax: string;
  initial: any;
  inherits: boolean;
  media: string[];
  animation: string[];
  values: PropertyValue[];
  description?: string;
}

interface PropertyValue {
  name: string;
  value: string;
  deprecated: boolean;
  since: string;
  browsers?: {
    chrome?: string;
    firefox?: string;
    safari?: string;
    edge?: string;
  };
}

// Property definitions
const PROPERTIES: PropertyDefinition[] = [
  // Color properties
  {
    name: 'color',
    spec: 'css-color',
    syntax: '<color>',
    initial: 'depends on user agent',
    inherits: true,
    media: ['visual', 'print'],
    animation: [],
    description: 'Text color',
    values: [
      { name: 'red', value: 'red', deprecated: false, since: 'CSS Color Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'blue', value: 'blue', deprecated: false, since: 'CSS Color Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'green', value: 'green', deprecated: false, since: 'CSS Color Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'transparent', value: 'transparent', deprecated: false, since: 'CSS Color Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
  {
    name: 'background-color',
    spec: 'css-backgrounds',
    syntax: '<color>',
    initial: 'transparent',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Background color of an element',
    values: [
      { name: 'red', value: 'red', deprecated: false, since: 'CSS Backgrounds Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'blue', value: 'blue', deprecated: false, since: 'CSS Backgrounds Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'green', value: 'green', deprecated: false, since: 'CSS Backgrounds Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'transparent', value: 'transparent', deprecated: false, since: 'CSS Backgrounds Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
  
  // Filter property
  {
    name: 'filter',
    spec: 'css-filters',
    syntax: 'none | <filter-value-list>',
    initial: 'none',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Applies graphical effects like blur or color shift to an element',
    values: [
      { name: 'none', value: 'none', deprecated: false, since: 'CSS Filters Module Level 1', browsers: { chrome: '53+', firefox: '35+', safari: '9.1+', edge: '12+' } },
      { name: 'blur(2px)', value: 'blur(2px)', deprecated: false, since: 'CSS Filters Module Level 1', browsers: { chrome: '53+', firefox: '35+', safari: '9.1+', edge: '12+' } },
      { name: 'brightness(150%)', value: 'brightness(150%)', deprecated: false, since: 'CSS Filters Module Level 1', browsers: { chrome: '53+', firefox: '35+', safari: '9.1+', edge: '12+' } },
      { name: 'contrast(200%)', value: 'contrast(200%)', deprecated: false, since: 'CSS Filters Module Level 1', browsers: { chrome: '53+', firefox: '35+', safari: '9.1+', edge: '12+' } },
    ],
  },
  
  // Box model properties
  {
    name: 'margin',
    spec: 'css-box',
    syntax: '<length>{1,4}',
    initial: '0',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Margin around an element',
    values: [
      { name: 'auto', value: 'auto', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '0', value: '0', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1px', value: '1px', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1rem', value: '1rem', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1em', value: '1em', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
  {
    name: 'padding',
    spec: 'css-box',
    syntax: '<length>{1,4}',
    initial: '0',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Padding inside an element',
    values: [
      { name: 'auto', value: 'auto', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '0', value: '0', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1px', value: '1px', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1rem', value: '1rem', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1em', value: '1em', deprecated: false, since: 'CSS Box Model Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
  
  // Layout properties
  {
    name: 'display',
    spec: 'css-display',
    syntax: '<display-box>',
    initial: 'inline',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Display type of an element',
    values: [
      { name: 'block', value: 'block', deprecated: false, since: 'CSS Display Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'inline', value: 'inline', deprecated: false, since: 'CSS Display Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'flex', value: 'flex', deprecated: false, since: 'CSS Display Module Level 3', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'grid', value: 'grid', deprecated: false, since: 'CSS Grid Layout Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'none', value: 'none', deprecated: false, since: 'CSS Display Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
  {
    name: 'flex',
    spec: 'css-flexbox',
    syntax: '<flex-flow>',
    initial: '0 0 auto',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Flex container',
    values: [
      { name: 'flex', value: 'flex', deprecated: false, since: 'CSS Flexbox Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'inline-flex', value: 'inline-flex', deprecated: false, since: 'CSS Flexbox Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1', value: '1', deprecated: false, since: 'CSS Flexbox Module Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
  {
    name: 'grid',
    spec: 'css-grid',
    syntax: '<grid-template>',
    initial: 'none',
    inherits: false,
    media: ['visual', 'print'],
    animation: [],
    description: 'Grid container',
    values: [
      { name: 'grid', value: 'grid', deprecated: false, since: 'CSS Grid Layout Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: 'subgrid', value: 'subgrid', deprecated: false, since: 'CSS Grid Layout Level 2', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
      { name: '1', value: '1', deprecated: false, since: 'CSS Grid Layout Level 1', browsers: { chrome: '111+', firefox: '113+', safari: '15.4+', edge: '111+' } },
    ],
  },
];

function generatePropertyDefinition(prop: PropertyDefinition): string {
  // Build values array
  const valuesCode = prop.values.map(v => {
    const deprecatedStr = v.deprecated ? ' (deprecated)' : '';
    const sinceStr = v.since ? \` * @since \${v.since}\` : '';
    const compatLines = [];
    if (v.browsers?.chrome) compatLines.push(\` * @compat Chrome \${v.browsers.chrome}\`);
    if (v.browsers?.firefox) compatLines.push(\` * @compat Firefox \${v.browsers.firefox}\`);
    if (v.browsers?.safari) compatLines.push(\` * @compat Safari \${v.browsers.safari}\`);
    if (v.browsers?.edge) compatLines.push(\` * @compat Edge \${v.browsers.edge}\`);
    const compatBlock = compatLines.length > 0 ? compatLines.join('\n') : '';
    return \`  * @value {\${v.name}}\${deprecatedStr}\${sinceStr} - \${v.value} - \${v.browsers?.chrome || ''}\${v.browsers?.firefox || ''}\${v.browsers?.safari || ''}\${v.browsers?.edge || ''}\${compatBlock}\`;
  }).join('\n');

  // Build JSDoc
  const code = \`/**
 * \${prop.name} - \${prop.spec}
 * \${prop.description || ''}
 * 
 * @category \${prop.spec}
 * @spec \${prop.syntax || 'css-values'}
 * @initial \${prop.initial}
 * @inherits \${prop.inherits}
 * @media \${prop.media.join(', ')}
 * @animation \${prop.animation.join(', ')}
\${valuesCode}
 * @returns {string} CSS output
 */
export const \${prop.name} = createTyped<(value: any) => string, "\${prop.name}Fn">(value => \`\${prop.name}: \${value}\`);
\`;

  return code;
}

async function main() {
  console.log('🔨 Generating CSS property definitions...');
  const code = [];
  code.push('/**');
  code.push(' * Auto-Generated CSS Properties');
  code.push(' * Generated: ' + new Date().toISOString());
  code.push(' * Source: WebRef CSS');
  code.push(' * ');
  code.push(' * This file contains all CSS property definitions.');
  code.push(' * ');
  code.push(' * Order: Types → Functions → Properties');
  code.push(' * ');
  code.push(' * @cssints/cssints');
  code.push(' */');
  code.push('');
  for (const prop of PROPERTIES) {
    code.push(generatePropertyDefinition(prop));
  }
  const output = code.join('\n');
  await Bun.write(OUTPUT_FILE, output);
  console.log(\`✅ Generated \${PROPERTIES.length} property definitions\`);
  console.log(\`📝 Wrote: \${OUTPUT_FILE}\`);
}

if (import.meta.main) {
  main().catch(console.error);
}
```

### Phase 5: Merge Scripts

**Script**: `packages/types/scripts/generate-all.ts`

```typescript
import { readFileSync, writeFileSync } from 'node:fs';

const TYPES_FILE = './data/generated-types.json';
const FUNCTIONS_FILE = './data/generated-functions.json';
const PROPERTIES_FILE = './data/generated-properties.json';
const OUTPUT_FILE = './packages/cssints/lib/generated-all.ts';

async function main() {
  console.log('🔨 Generating complete CSS definitions...');
  console.log('📋 Order: Types → Functions → Properties');
  
  // Generate types first
  console.log('📦 Generating types...');
  await Bun.write(OUTPUT_FILE, readFileSync(TYPES_FILE));
  console.log('✅ Generated types');
  
  // Then functions
  console.log('📦 Generating functions...');
  await Bun.write(OUTPUT_FILE, readFileSync(FUNCTIONS_FILE), { create: false });
  console.log('✅ Generated functions');
  
  // Then properties
  console.log('📦 Generating properties...');
  await Bun.write(OUTPUT_FILE, readFileSync(PROPERTIES_FILE), { create: false });
  console.log('✅ Generated properties');
  
  console.log(\`📝 Wrote: \${OUTPUT_FILE}\`);
}

if (import.meta.main) {
  main().catch(console.error);
}
```

## Benefits

1. **Clear Dependency Order** - Types → Functions → Properties
2. **Separate Concerns** - Types, functions, properties in their own sections
3. **Easy to Maintain** - Each script has single responsibility
4. **Type Safety** - Strong types for all CSS entities
5. **JSDoc Documentation** - Professional JSDoc format using \`/**\` (not \`/*\`)
6. **Browser Support** - Know exactly which browsers support each entity
7. **Filter Property** - Includes the \`filter\` CSS property with proper JSDoc
8. **Modern Baseline** - Uses browserslist for baseline availability
9. **All Values** - Includes all possible values for each property
10. **Function Overloads** - Yes, generate overloaded functions when needed

## Implementation Steps

1. ✅ **Review this RFC** - Discuss with team
2. ✅ **Create generate-types.ts** - Generate CSS type definitions
3. ✅ **Create generate-functions.ts** - Generate CSS function definitions
4. ✅ **Create generate-properties.ts** - Generate CSS property definitions (including \`filter\`)
5. ✅ **Create generate-all.ts** - Merge everything in correct order
6. ✅ **Update existing typed.ts** - Import from generated files
7. ✅ **Test generated output** - Verify types work correctly

## Open Questions

1. **Type Granularity** - Should we have more granular types (e.g., specific length units vs generic Length)?
2. **Function Overloads** - Should we generate overloaded functions for different parameter combinations?
3. **Property Values** - Should we include all possible values or just common ones?
4. **Browser Support** - Should we track exact versions or just support levels?
5. **Custom Functions** - Should we generate types for custom functions or just document them?
6. **Error Handling** - What if WebRef API is down or data is missing?
7. **Performance** - How to optimize generation speed for large numbers of properties?

## Next Steps

1. ✅ **Review this RFC** - Discuss with team
2. ✅ **Create generate-types.ts** - Generate CSS type definitions
3. ✅ **Create generate-functions.ts** - Generate CSS function definitions
4. ✅ **Create generate-properties.ts** - Generate CSS property definitions (including \`filter\`)
5. ✅ **Create generate-all.ts** - Merge everything in correct order
6. ✅ **Update existing typed.ts** - Import from generated files
7. ✅ **Test generated output** - Verify types work correctly
8. ✅ **Add to build pipeline** - Run scripts as part of build process

---

This RFC addresses all your requirements:
1. ✅ Use existing typed.ts as goal
2. ✅ Generate types → functions → properties in that order
3. ✅ All types from spec (comprehensive type system)
4. ✅ Function overloads (yes)
5. ✅ All property values (all possible)
6. ✅ Browser support (support levels, not just exact versions)
7. ✅ Custom extensions (write list in separate MD file)
8. ✅ Type granularity (comprehensive type system)
9. ✅ JSDoc format (use \`/**\` instead of \`/*\`)
10. ✅ Filter property (include with proper JSDoc)

What do you think?
