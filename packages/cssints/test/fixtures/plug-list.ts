// A member whose declaration is a list (`append()`): two of its property in one cn() join their values instead of the later
// one replacing the earlier; `plain` sets the same property as a value, `fallback` a list with alternatives (an error).
import { append, arg, scope } from "cssints/plugin";

export const { list, plain, fallback } = scope("plist", {
  "#k": { css: "&{color:red}" },
  list: { args: [arg<string>()], uses: ["k"] },
  plain: { args: [arg<string>()], uses: ["k"] },
  fallback: { args: [], uses: ["k"] },
})
  .build({
    list: (v) => ({ decls: [append("--plist-x", v)] }),
    plain: (v) => ({ decls: [["--plist-x", v]] }),
    fallback: () => ({ decls: [["--plist-y", "a", undefined, ["b"], ","]] }),
  })
  .export();
