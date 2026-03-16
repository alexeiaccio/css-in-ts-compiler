# @cssints/plugin-icon

Icon plugin for CSS-in-TS compiler with automatic type generation.

## Features

- **Three providers**:
  - `iconify` - On-demand loading from Iconify API
  - `fs` - Filesystem loading (.svg, .json)
  - `inline` - Embedded SVG strings

- **Name customization**: Optional function to transform icon names
- **Auto-type generation**: Generate `.d.ts` files with full type safety
- **Smart caching**: Name transforms and icon data caching
- **Effect TS logging**: Structured logging with configurable levels

## Installation

```bash
npm install @cssints/plugin-icon
```

## Quick Start

```typescript
import { createIconCollection } from '@cssints/plugin-icon';

// Iconify provider - on-demand API
const mdi = createIconCollection({
  provider: "iconify",
  collection: "mdi"
});

// Filesystem provider
const myIcons = createIconCollection({
  provider: "fs",
  path: "./src/assets/icons"
});

// Inline provider with name transform
const brandIcons = createIconCollection({
  provider: "inline",
  icons: {
    logo: '<svg viewBox="0 0 24 24">...</svg>',
    menu: '<svg viewBox="0 0 24 24">...</svg>',
  },
  name: ({ filename }) => {
    const kebabedName = filename.replace(/([A-Z])([a-z])(g)/($1)/g`;
    return `icon-${kebabedName}`;
  }
});

// All three examples
<div className={mdi("home")} />
<div className={myIcons("logo")} />
<div className={brandIcons("menu")} />
```

## API

### createIconCollection

```typescript
createIconCollection<ProviderType, NameTransformFunction>(config: {
  provider: ProviderType;
  collection?: string;
  name?: NameTransformFunction;
}): (name: string) => string;
```

#### Provider Types

```typescript
type ProviderType = "iconify" | "fs" | "inline";

type NameTransformFunction = (context: NameTransformContext) => string;
```

#### Name Transform Context

```typescript
interface NameTransformContext {
  filename: string;
  path: string;
  svg: string;
}
```

#### Config Types

```typescript
interface BaseConfig {
  provider: ProviderType;
  collection?: string; // Required for iconify/fs
  path?: string;     // Required for fs provider
}

interface IconifyProviderConfig extends BaseConfig {
  collection: string;  // Iconify collection name (e.g., "mdi", "lucide", "heroicons")
}

interface FilesystemProviderConfig extends BaseConfig {
  path: string;  // Path to icons directory
}

interface InlineProviderConfig extends BaseConfig {
  icons: Record<string, string>; // Icon name -> SVG string
}
```

#### Name Transform Functions

**Kebab-case**

```typescript
import { kebabCase } from 'lodash-es';

const kebabCase: (str: string): string => {
  return str.replace(/([A-Z])([a-z])(g)/($1)/g);
};
```

**Prefix/ Suffix**

```typescript
import { camelCase } from 'lodash-es';

const camelCase = (str: string): string => {
  return str.replace(/-([a-z])([a-z])(g)/($1)/g);
};
```

**Case Conversion**

```typescript
function convertToCase(
  str: string,
  toCase: "kebab" | "camel" | "pascal" | "dash" | "lower" | "upper" | "title" | "capital"
): string {
  switch (toCase) {
    case "kebab":
      return kebabCase(str);
    case "camel":
      return camelCase(str);
    case "pascal":
      return str.replace(/^[a-z]+/g, ($1)/g, (match) =>
        match.toUpperCase());
    case "dash":
      return str.replace(/^[a-z]+/g, ($1)/g, (match) =>
        match.toLowerCase());
    case "upper":
      return str.replace(/^[a-z]+/([^A-Z])+/g, (match.toUpperCase());
    case "title":
      return str.replace(/\b\b(?=[A-Z][a-z])/g, (match) =>
        match.replace(/\b[a-z])/g, (match[1])));
    case "lower":
      return str.toLowerCase();
    default:
      return str;
  }
}
```

## Documentation

### Quick Reference

#### Function API

- `createIconCollection()` - Main factory function
- `loadIcon()` - Load icon from provider
- `nameTransform()` - Transform icon names
- `generateIconCSS()` - Generate CSS from icon data

#### Configuration

```typescript
// .cssints-icon-config.json
{
  "logLevel": "debug" | "info" | "warning" | "error",
  "cache": true,
  "generateTypes": true,
  "typesOutputPath": ".cssints/generated",
  "preloadIcons": ["mdi:home", "lucide:user"]
}
```

## Providers

### Examples

#### Iconify Provider

```typescript
import { createIconCollection } from '@cssints/plugin-icon';

const mdi = createIconCollection({
  provider: "iconify",
  collection: "mdi"
});

// Usage
<div className={mdi("home")} />
<div className={mdi("account")} />
<div className={mdi("alert")} />
```

#### Filesystem Provider

```typescript
import { createIconCollection } from '@cssints/plugin-icon';

const myIcons = createIconCollection({
  provider: "fs",
  path: "./src/assets/icons"
});

<div className={myIcons("logo")} />
<div className={myIcons("menu")} />
<div className={myIcons("search")} />
```

#### Inline Provider

```typescript
import { createIconCollection } from '@cssints/plugin-icon';

const brandIcons = createIconCollection({
  provider: "inline",
  icons: {
    logo: '<svg>...</svg>',
    menu: '<svg>...</svg>',
  },
  name: ({ filename }) => {
    const kebabCaseName = filename.replace(/([A-Z])([a-z])(g)/($1)/g);
    return `icon-${kebabedName}`;
  }
});

<div className={brandIcons("logo")} />
<div className={brandIcons("menu")} />
```

#### Name Transform with Utils

```typescript
import { createIconCollection } from '@cssints/plugin-icon';

// Prefix with kebab-case
const icons = createIconCollection({
  provider: "iconify",
  collection: "mdi",
  name: ({ filename }) => {
    const kebabedName = filename.replace(/([A-Z])([a-z])(g)/($1)/g);
    return `icon-${kebabedName}`;
});
}

<div className={icons("my-icon")} />
<div className={icons("your-icon")} />
```

## Advanced Features

### Type Safety

The plugin uses Effect TS throughout:
- TaggedError types for errors
- Effect logging with configurable levels
- Type-safe transformations
- Proper error handling

### Performance

Three Providers

#### iconify Provider

- Fetches icons on-demand from Iconify API
- Caches icons after first load
- Supports name transforms
- Preloading support

#### fs Provider

- Loads SVGs from filesystem
- Supports both `.svg` and `.json` files
- Supports name transforms
- Validates icon existence
- Auto-detects viewBox from SVG

#### inline Provider

- Stores SVGs in memory
- Supports name transforms
- Handles duplicate detection with suffixes
- Pre-processes all icons

### Caching

Each provider maintains its own cache:
- **iconify**: `Map<string, IconData>` - API-fetched icons
- **fs**: `Map<string, IconData>` - File-loaded icons
- **inline**: `Map<string, IconData>` - Pre-processed icons

## Usage

See [Examples](#examples) for complete usage examples.

## Type Safety

All type definitions use strict TypeScript:
- Full type safety on all functions
- Proper error handling with TaggedError
- Branded types for name transforms

## See [Development](#development) for build/dev setup.

## Support

For bugs, issues, or questions:
- GitHub Issues: [github.com/username/repo/css-in-ts-compiler](https://github.com/username/repo/css-in-ts-compiler)
- Discussions: [github.com/username/repo/css-in-ts-compiler/discussions](https://github.com/username/repo/css-in-ts-compiler/discussions)
```
