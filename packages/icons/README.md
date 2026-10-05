# @cssints/icons

Icons for [cssints](../../README.md): a scope() style with a mask kernel and one class per icon, from an iconify JSON collection
(`@iconify-json/*`) or a folder of SVG files. No runtime. The API is in [docs/API.md](../../docs/API.md#icons-cssintsicons-decided-2026-10-02-cssints-1x1o).

```ts
import { icons } from "@cssints/icons" with { type: "cssints" };

export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
  provider: "iconify-json",
  collection: "mdi",
});
// in a component: cn(mdi("home"), color("crimson"))
```

```bash
cd packages/icons && bun run test   # fixtures through the engine, and the type test
```
