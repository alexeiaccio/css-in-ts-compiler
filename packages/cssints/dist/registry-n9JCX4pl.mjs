import { Context, Data } from "effect";
//#region src/errors.ts
/** A css.* call, cv(), or a value in it is wrong. `file`, `site` (index) and `offset` name the call site, when known. */
var MacroError = class extends Data.TaggedError("MacroError") {};
/** A plugin member was called wrongly, or its styles conflict. `pluginName` is the member's name; the call site as in MacroError. */
var MemberError = class extends Data.TaggedError("MemberError") {};
/** `import ... from "cssints"` without the attribute names something that only exists at build time. */
var ImportError = class extends Data.TaggedError("ImportError") {};
/** Evaluating the module threw something that is not a MacroError, or did not finish in time. */
var EvalError = class extends Data.TaggedError("EvalError") {};
/** The module ran, but a site of it did not report a replacement. */
var SiteMissingError = class extends Data.TaggedError("SiteMissingError") {};
/** Vite refused something the plugin asked of it: the private server, the CSS pipeline. */
var HookError = class extends Data.TaggedError("HookError") {};
/** cssints/check `contrast`: a colour that has no contrast (one it cannot read, or a translucent one). */
var ContrastError = class extends Data.TaggedError("ContrastError") {};
//#endregion
//#region src/registry.ts
const registry = globalThis.__cssints ??= {
	sites: /* @__PURE__ */ new Map(),
	rules: /* @__PURE__ */ new Map(),
	globals: /* @__PURE__ */ new Map(),
	layers: /* @__PURE__ */ new Map(),
	kernels: /* @__PURE__ */ new Map(),
	runtimes: /* @__PURE__ */ new Map(),
	scopes: /* @__PURE__ */ new Map(),
	userProps: /* @__PURE__ */ new Set(),
	seen: /* @__PURE__ */ new Map(),
	properties: /* @__PURE__ */ new Map(),
	defs: /* @__PURE__ */ new Map(),
	themed: /* @__PURE__ */ new Map(),
	checks: /* @__PURE__ */ new Map(),
	gen: 0,
	tokens: 0,
	warnings: [],
	warned: /* @__PURE__ */ new Set(),
	lowered: /* @__PURE__ */ new Map(),
	files: /* @__PURE__ */ new Set()
};
const warn = (state, key, message, at = state.at) => {
	const k = `${at?.file ?? ""}\0${key}`;
	if (state.warned.has(k)) return;
	state.warned.add(k);
	state.warnings.push({
		message,
		at
	});
};
const forgetWarnings = (files) => {
	if (!files) return registry.warned.clear();
	const prefixes = files.map((f) => `${f}\0`);
	for (const k of registry.warned) if (prefixes.some((p) => k.startsWith(p))) registry.warned.delete(k);
};
const Registry = Context.Reference("cssints/Registry", { defaultValue: () => registry });
const unuse = (entries, file) => {
	for (const [k, e] of entries) if (e.users.delete(file) && !e.users.size) entries.delete(k);
};
const forgetKernels = (file) => {
	for (const entries of [
		registry.kernels,
		registry.runtimes,
		registry.globals,
		registry.layers
	]) unuse(entries, file);
};
const forget = (file) => {
	forgetKernels(file);
	for (const [k, t] of registry.themed) if (t.file === file) registry.themed.delete(k);
	for (const [k, c] of registry.checks) if (c.at.file === file) registry.checks.delete(k);
};
//#endregion
export { registry as a, EvalError as c, MacroError as d, MemberError as f, forgetWarnings as i, HookError as l, forget as n, warn as o, SiteMissingError as p, forgetKernels as r, ContrastError as s, Registry as t, ImportError as u };
