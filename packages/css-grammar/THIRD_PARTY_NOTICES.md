# Third-party notices

The code of `@cssints/css-grammar` is MIT (`LICENSE`). The generated data in `src/` (and `dist/`) keeps the license of its
source.

## Data

- **mdn-data** (`src/mdn.ts`, `src/keywords.ts`, `src/functions.ts`): the CSS syntax strings, copied verbatim by
  `bun run extract`. CC0 1.0 Universal, the mdn-data contributors. <https://github.com/mdn/data>
- **@webref/css** (`src/mdn.ts`): the numeric ranges that mdn-data leaves out, copied by `bun run extract`. MIT,
  Copyright (c) 2020 World Wide Web Consortium. <https://github.com/w3c/webref>
- **@mdn/browser-compat-data**: read at build time for the support warnings, not copied. CC0 1.0 Universal.
  <https://github.com/mdn/browser-compat-data>
- `src/longhands.ts` and `scripts/webref-properties.json` are written by `bun run longhands` and `bun run webref`, which
  ask Chrome how it expands a shorthand and what it accepts. They hold facts, no text of a source.

The MIT notice of @webref/css, Copyright (c) 2020 World Wide Web Consortium:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
> documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
> rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
> persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
> Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
> WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
> COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
> OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

CC0 1.0 Universal needs no notice. The full text is in the `LICENSE` of the `mdn-data` and `@mdn/browser-compat-data`
packages.
