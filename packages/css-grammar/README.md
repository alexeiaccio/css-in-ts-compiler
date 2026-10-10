# @cssints/css-grammar

The engine under [cssints](https://cssints.accio.blue): a recognizer of CSS values over the grammars of mdn-data, once as TypeScript types (`css`) and once as a runtime twin (`twin`, `check`), with browser support warnings from `@mdn/browser-compat-data`.

You do not install it yourself. `cssints` depends on it, and its types and checks reach your code through `cssints`.

Every subpath is a module (`@cssints/css-grammar/check`, `/support`, `/longhands`, ...). They are internal: the API of the package is the API of `cssints`, in [docs/API.md](https://cssints.accio.blue).

## Tests

```bash
bun run test    # twin and type checks, support and prose rules, tsc
bun run bench   # instantiation budgets
```

MIT
