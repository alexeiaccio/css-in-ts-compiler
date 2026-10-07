import { A as HookError, E as forget, M as MacroError, N as MemberError, O as registry, P as SiteMissingError, S as runtimeNames, T as Registry, _ as DERIVED, a as closeNames, b as fallbackEntries, c as layerEntries, f as themedEntries, g as kernelEntries, j as ImportError, k as EvalError, l as layerStatements, m as usesDerived, n as addGlobal, o as globalEntries, r as addLayers, s as globalNames, t as LAYERS, u as renderSheet, v as RUNTIME_ID, x as runtimeModule } from "./sheet-DOHuHrWO.mjs";
import { createRequire } from "node:module";
import { Cause, Clock, Config, Effect, Exit, Formatter, Option, Predicate, Result, Schema, Semaphore } from "effect";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { browserslistToTargets } from "lightningcss";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { browsers } from "@cssints/css-grammar/browsers";
import MagicString from "magic-string";
import { createServer, createServerModuleRunner, transformWithOxc } from "vite";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import { ESModulesEvaluator, ssrModuleExportsKey } from "vite/module-runner";
import { parseSync } from "oxc-parser";
//#region src/contrast.ts
const VAR = /var\((--[^\s,)]+)\)/g;
const valueOf = (state, name, values) => {
	const def = state.defs.get(name);
	const text = values?.get(name) ?? def?.template;
	return text === void 0 ? def?.value : text.replace(VAR, (m, n) => state.defs.has(n) ? valueOf(state, n, values) : m);
};
const affectedBy = (defs, names, out = /* @__PURE__ */ new Set()) => {
	for (const n of names) if (!out.has(n)) {
		out.add(n);
		affectedBy(defs, defs.get(n)?.refs ?? [], out);
	}
	return out;
};
const together = ({ themed, layers }) => {
	const order = layerStatements([...layers.values()].map((l) => l.names)).flat();
	const rank = (layer) => layer === void 0 ? -1 : order.indexOf(layer);
	const groups = /* @__PURE__ */ new Map();
	for (const t of [...themed.values()].sort((a, b) => rank(a.layer) - rank(b.layer) || (a.key < b.key ? -1 : 1))) {
		if (!t.theme) continue;
		const { label, scope, values } = t.theme;
		const key = `${label}\t${scope ?? ""}`;
		const group = groups.get(key) ?? groups.set(key, {
			label,
			values: /* @__PURE__ */ new Map()
		}).get(key);
		for (const [n, v] of values) group.values.set(n, v);
	}
	return groups.values();
};
const shown = (r) => (Math.floor(r * 100) / 100).toFixed(2);
const verify = (check, state, { luminance, ratio }) => {
	const { fg, bg, min } = check;
	const path = (n) => state.defs.get(n)?.path ?? n;
	const affecting = affectedBy(state.defs, [fg, bg]);
	const subjects = [{ label: "the default values" }];
	for (const { label, values } of together(state)) if ([...values.keys()].some((n) => affecting.has(n))) subjects.push({
		label: `theme ${label}`,
		values
	});
	const errors = [];
	for (const { label, values } of subjects) {
		const pair = [fg, bg].map((n) => {
			const text = valueOf(state, n, values) ?? "";
			return {
				name: n,
				text,
				l: luminance(text)
			};
		});
		const [f, b] = pair;
		let ok = true;
		for (const p of pair) if (p.l.why !== void 0) {
			ok = false;
			const key = `contrast ${p.name} ${p.text}`;
			if (!state.warned.has(key)) {
				state.warned.add(key);
				state.warnings.push(`cssints: contrast is not checked for ${path(p.name)} in ${label}: "${p.text}" ${p.l.why}`);
			}
		}
		if (!ok || f.l.lum === void 0 || b.l.lum === void 0) continue;
		const r = ratio(f.l.lum, b.l.lum);
		if (r < min) errors.push(`cssints: contrast ${shown(r)} is below ${min}: ${path(fg)} ${f.text} on ${path(bg)} ${b.text}, in ${label}`);
	}
	return errors;
};
const verifyChecks = Effect.fnUntraced(function* (select) {
	const checks = [...registry.checks.values()].filter(select);
	if (!checks.length) return;
	const colours = yield* Effect.promise(() => import("./color-BoS0LblL.mjs"));
	for (const check of checks) {
		const errors = verify(check, registry, colours);
		if (errors.length) return yield* new MacroError({
			message: errors.join("\n"),
			...check.at
		});
	}
});
//#endregion
//#region src/evaluate.ts
var DomEvaluator = class extends ESModulesEvaluator {
	win = Object.assign(new Window(), { __jsx: () => null });
	names = Object.getOwnPropertyNames(this.win).filter((k) => !Reflect.has(globalThis, k));
	async runInlinedModule(context, code) {
		const keys = Object.keys(context);
		const fn = new Function(...this.names, `return async function (${keys.join(",")}) {"use strict";\n${code}\n}`);
		const globals = this.win;
		const values = context;
		await fn(...this.names.map((k) => globals[k]))(...keys.map((k) => values[k]));
		Object.seal(context[ssrModuleExportsKey]);
	}
};
const evalLock = Semaphore.makeUnsafe(1);
const LIB = fileURLToPath(new URL("./index.ts", import.meta.url));
const clearApp = ({ idToModuleMap, urlToIdModuleMap, fileToModulesMap }) => {
	const lib = /* @__PURE__ */ new Set();
	const walk = (m) => {
		if (!m || lib.has(m)) return;
		lib.add(m);
		m.imports.forEach((id) => walk(idToModuleMap.get(id)));
	};
	walk(idToModuleMap.get(LIB));
	for (const map of [idToModuleMap, urlToIdModuleMap]) for (const [k, m] of map) if (!lib.has(m)) map.delete(k);
	for (const [k, ms] of fileToModulesMap) for (const m of ms) if (!lib.has(m) && ms.delete(m) && !ms.size) fileToModulesMap.delete(k);
};
const isMacroError = (e) => Predicate.isTagged(e, "MacroError");
const isMemberError = (e) => Predicate.isTagged(e, "MemberError");
const failureOf = (id, registry) => (e) => {
	if (isMacroError(e)) return new MacroError({
		message: e.message,
		file: e.file,
		site: e.site,
		offset: e.offset,
		cause: e.cause
	});
	if (isMemberError(e)) return new MemberError({
		message: e.message,
		pluginName: e.pluginName,
		file: e.file,
		site: e.site,
		offset: e.offset,
		cause: e.cause
	});
	const at = registry.at;
	const name = at && e instanceof ReferenceError ? /^(\S+) is not defined$/.exec(e.message)?.[1] : void 0;
	return name ? new MacroError({
		message: `cssints: css arguments must be known at build time: \`${name}\` is not defined where the call is evaluated (a parameter, a prop or state). Use cx(on && p(4)), a cv variant, or a token in a style prop`,
		cause: e,
		...at
	}) : new EvalError({
		file: id,
		message: e instanceof Error ? e.message : String(e),
		cause: e
	});
};
const evaluateModule = Effect.fnUntraced(function* (runner, id) {
	const registry = yield* Registry;
	registry.sites.delete(id);
	forget(id);
	registry.at = void 0;
	registry.gen++;
	clearApp(runner.evaluatedModules);
	yield* Effect.tryPromise({
		try: () => runner.import(id).then((m) => m.__cssints_hoisted?.()),
		catch: failureOf(id, registry)
	}).pipe(Effect.withSpan("cssints.runner.import", { attributes: { file: id } }), Effect.timeoutOrElse({
		duration: "30 seconds",
		orElse: () => Effect.fail(new EvalError({
			file: id,
			message: `cssints: evaluating ${id} took more than 30 seconds`
		}))
	}));
	yield* verifyChecks((c) => c.gen === registry.gen);
	return registry.sites.get(id) ?? /* @__PURE__ */ new Map();
});
/** Evaluates `id` and runs `whileLocked` on its sites before the next evaluation may start (runner.qnt `rules`). */
const evaluate = Effect.fn("cssints.evaluate")(function* (runner, id, whileLocked) {
	return yield* evalLock.withPermit(evaluateModule(runner, id).pipe(Effect.flatMap(whileLocked)));
});
//#endregion
//#region src/instrument.ts
const RUNTIME = "cssints";
const rootIdent = (n) => n.type === "Identifier" ? n.name : n.type === "MemberExpression" ? rootIdent(n.object) : n.type === "CallExpression" ? rootIdent(n.callee) : null;
const RUNTIME_ONLY = /* @__PURE__ */ new Set(["cx", "_cv"]);
const nameOf = (m) => m.type === "Identifier" ? m.name : m.value;
const isSiteImport = (s) => s.attributes.some((a) => (a.key.type === "Identifier" ? a.key.name : a.key.value) === "type" && a.value.value === "cssints");
const importedName = (x) => x.type === "ImportSpecifier" ? nameOf(x.imported) : null;
const isRuntime = (d, x) => d.source.value === "cssints" && x.type === "ImportSpecifier" && RUNTIME_ONLY.has(nameOf(x.imported));
const keptImport = (d, code) => {
	const names = d.specifiers.filter((x) => isRuntime(d, x)).map((x) => code.slice(x.start, x.end));
	return names.length ? `import { ${names.join(", ")} } from ${Formatter.formatJson(RUNTIME)};` : "";
};
const findCssImport = Effect.fnUntraced(function* (program, code, id) {
	const locals = /* @__PURE__ */ new Set();
	const decls = [];
	for (const s of program.body) {
		if (s.type !== "ImportDeclaration") continue;
		if (isSiteImport(s)) {
			decls.push(s);
			s.specifiers.forEach((x) => isRuntime(s, x) || locals.add(x.local.name));
		} else if (s.source.value === "cssints") {
			const bad = s.specifiers.filter((x) => x.type !== "ImportSpecifier" || !RUNTIME_ONLY.has(importedName(x) ?? ""));
			if (!bad.length) continue;
			const names = bad.map((x) => code.slice(x.start, x.end));
			const fix = bad[0].type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
			return yield* new ImportError({
				message: `cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }; (only cx and _cv are runtime)`,
				file: id,
				offset: s.start
			});
		}
	}
	return locals.size ? {
		locals,
		decls
	} : null;
});
const CONDITIONS = /* @__PURE__ */ new Set([
	"media",
	"container",
	"supports",
	"attr",
	"within"
]);
const boundNames = (id, out) => {
	if (!id) return;
	if (id.type === "Identifier") out.add(id.name);
	else if (id.type === "ArrayPattern") id.elements.forEach((e) => boundNames(e, out));
	else if (id.type === "ObjectPattern") id.properties.forEach((p) => boundNames(p.type === "Property" ? p.value : p.argument, out));
	else if (id.type === "AssignmentPattern") boundNames(id.left, out);
};
function withConditions(program, code, { locals, decls }) {
	if (!/\b(?:media|container|supports|attr|within)\b/.test(code)) return locals;
	const ctors = /* @__PURE__ */ new Set();
	for (const d of decls) for (const x of d.specifiers) if (x.type === "ImportSpecifier" && CONDITIONS.has(nameOf(x.imported))) ctors.add(x.local.name);
	const all = new Set(locals);
	const walk = (node) => {
		if (!Predicate.isObject(node) || typeof node.type !== "string") return;
		const n = node;
		if (n.type === "VariableDeclarator" && n.init?.type === "CallExpression") {
			const c = n.init.callee;
			if (c.type === "Identifier" && ctors.has(c.name) || c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier" && CONDITIONS.has(c.property.name) && locals.has(rootIdent(c.object) ?? "")) boundNames(n.id, all);
		}
		for (const k in node) {
			const v = node[k];
			if (Array.isArray(v)) v.forEach(walk);
			else if (Predicate.isObject(v) && "type" in v) walk(v);
		}
	};
	walk(program);
	return all;
}
function findSites(program, locals) {
	const sites = [];
	const walk = (node, inFn) => {
		if (!Predicate.isObject(node) || typeof node.type !== "string") return;
		const n = node;
		if ((n.type === "CallExpression" || n.type === "NewExpression") && locals.has(rootIdent(n.callee) ?? "")) {
			sites.push({
				start: n.start,
				end: n.end,
				inFn
			});
			return;
		}
		const fn = inFn || /Function/.test(n.type);
		for (const k in node) {
			const v = node[k];
			if (Array.isArray(v)) v.forEach((c) => walk(c, fn));
			else if (Predicate.isObject(v) && "type" in v) walk(v, fn);
		}
	};
	walk(program, false);
	return sites;
}
const instrument = Effect.fn("cssints.instrument")(function* (code, id) {
	const { program } = parseSync(id, code);
	const imp = yield* findCssImport(program, code, id);
	if (!imp) return null;
	const sites = findSites(program, withConditions(program, code, imp));
	const ms = new MagicString(code);
	const hoisted = [];
	const file = Formatter.formatJson(id);
	sites.forEach((s, n) => {
		const site = `__site(__at(${file}, ${n}, ${s.start}), `;
		const expr = code.slice(s.start, s.end);
		if (s.inFn) hoisted.push(`${site}${expr});`);
		else {
			ms.prependLeft(s.start, site).appendRight(s.end, ")");
			hoisted.push(`__unseen(${file}, ${n}) && ${site}${expr});`);
		}
	});
	imp.decls.forEach((d, i) => {
		if (d.source.value !== "cssints") return;
		const ns = d.specifiers.find((x) => x.type === "ImportNamespaceSpecifier");
		const named = d.specifiers.filter((x) => !isRuntime(d, x));
		const bind = ns ? ns.local.name : `{ ${named.map((x) => `${Formatter.formatJson(importedName(x))}: ${x.local.name}`).join(", ")} }`;
		ms.overwrite(d.start, d.end, `import { css as __css${i} } from ${Formatter.formatJson(RUNTIME)}; const ${bind} = __css${i};${keptImport(d, code)}`);
	});
	ms.prepend(`import { __at, __site, __unseen } from ${Formatter.formatJson(RUNTIME)};\n`);
	if (hoisted.length) ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
	return {
		code: ms.toString(),
		sites,
		imp
	};
});
//#endregion
//#region src/trace.ts
const mode = /^otlp(?::(.+))?$/.exec(Effect.runSync(Config.String("CSSINTS_TRACE").pipe(Config.withDefault(""))));
const otlp = mode ? await import("./trace-otlp-CbKFDsn9.mjs").then((m) => m.start(mode[1] ?? "http://localhost:4318")) : void 0;
let runtime = otlp;
const runSync = otlp ? (e) => runtime ? runtime.runSync(e) : Effect.runSync(e) : Effect.runSync;
const runPromiseExit = otlp ? (e, o) => runtime ? runtime.runPromiseExit(e, o) : Effect.runPromiseExit(e, o) : Effect.runPromiseExit;
/**
* Sends what is buffered and stops the exporter, whose timer would keep Node alive (the end of a build, `server.close()`;
* a script that exits itself calls it first). Later hooks run untraced. A no-op when off.
* @returns {Promise<void>} resolved when the exporter has stopped
*/
const closeTrace = () => {
	const r = runtime;
	runtime = void 0;
	return r ? r.dispose() : Promise.resolve();
};
const note = (e) => Effect.flatMap(Effect.all([Effect.currentSpan, Clock.currentTimeNanos]), ([span, now]) => Effect.sync(() => {
	span.event("cssints.error", now, {
		message: e.message,
		file: e.file,
		offset: e.offset
	});
	Object.assign(e, {
		traceId: span.traceId,
		spanId: span.spanId,
		message: `${e.message} (trace ${span.traceId})`
	});
})).pipe(Effect.ignore);
const hook = otlp ? (name, file, program, environment) => program.pipe(Effect.tapCause((cause) => {
	const e = Cause.squash(cause);
	return Predicate.hasProperty(e, "message") ? note(e) : Effect.void;
}), Effect.withSpan(name, {
	root: true,
	attributes: {
		file,
		environment
	}
})) : (_name, _file, program) => program;
const warned = otlp ? (ws, file) => Effect.flatMap(Effect.all([Effect.currentSpan, Clock.currentTimeNanos]), ([span, now]) => Effect.sync(() => ws.forEach((message) => span.event("cssints.warning", now, {
	message,
	file
})))).pipe(Effect.ignore) : () => Effect.void;
//#endregion
//#region src/plugin.ts
const FILE_RE = /\.(ts|tsx|js|jsx|mts|mjs)$/;
const VERSION = /[?&]v=\w+$/;
const SHEET_IMPORT = "virtual:cssints.css";
const SHEET = `\0${SHEET_IMPORT}`;
const ATTRIBUTE = /type\s*:\s*["']cssints["']/;
const marked = (code, id) => code.includes("cssints") && (!id.includes("node_modules") || ATTRIBUTE.test(code));
const Deps = Schema.optional(Schema.Record(Schema.String, Schema.String));
const Manifest = Schema.fromJsonString(Schema.Struct({
	dependencies: Deps,
	devDependencies: Deps,
	peerDependencies: Deps
}));
const decodeManifest = Schema.decodeUnknownOption(Manifest);
const packagesOnCssints = (root) => Effect.sync(() => {
	const read = (file) => Option.getOrUndefined(Option.flatMap(Result.getSuccess(Result.try(() => readFileSync(file, "utf8"))), decodeManifest));
	const app = read(join(root, "package.json"));
	const lookup = createRequire(join(root, "package.json")).resolve.paths("cssints") ?? [];
	return Object.keys({
		...app?.dependencies,
		...app?.devDependencies
	}).filter((name) => {
		const m = lookup.map((dir) => read(join(dir, name, "package.json"))).find(Boolean);
		return !!m && Object.hasOwn({
			...m.dependencies,
			...m.peerDependencies
		}, "cssints");
	});
});
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);
/** LightningCSS targets (css.lightningcss.targets) from the browserslist query of the support warnings. */
const targets = browserslistToTargets(Effect.runSync(browsers()));
const ESBUILD = {
	ios_saf: "ios",
	ie: "ie",
	opera: "opera",
	edge: "edge",
	chrome: "chrome",
	firefox: "firefox",
	safari: "safari"
};
/** `build: { cssTarget }`, the browserslist query of the support warnings, so a minified build keeps `firstThatWorks` fallbacks. */
const cssTarget = Effect.runSync(browsers()).flatMap((t) => {
	const [agent, version] = t.split(" ");
	return ESBUILD[agent] && /^\d/.test(version) ? [`${ESBUILD[agent]}${version.split("-")[0]}`] : [];
});
const run = (program) => runPromiseExit(program).then((exit) => {
	if (Exit.isSuccess(exit)) return exit.value;
	throw Cause.squash(exit.cause);
});
const lineCol = (text, offset) => {
	let line = 1;
	let lineStart = 0;
	for (let i = text.indexOf("\n"); i !== -1 && i < offset; i = text.indexOf("\n", i + 1)) {
		line++;
		lineStart = i + 1;
	}
	return {
		line,
		column: offset - lineStart
	};
};
const locate = Effect.fn("cssints.locate")(function* (e, code, id) {
	const file = Predicate.hasProperty(e, "file") && e.file ? e.file : id;
	if (Predicate.hasProperty(e, "offset") && e.offset !== void 0) {
		const text = file === id ? code : yield* Effect.tryPromise(() => readFile(file, "utf8")).pipe(Effect.orElseSucceed(() => void 0));
		if (text !== void 0) Object.assign(e, {
			id: file,
			loc: {
				file,
				...lineCol(text, e.offset)
			}
		});
	}
	return yield* e;
});
function cssints({ inner = false } = {}) {
	let server;
	let ownServer = false;
	let runner;
	let build = false;
	let root = process.cwd();
	let cssPlugins = [];
	const usedBy = /* @__PURE__ */ new Map();
	const depsOf = /* @__PURE__ */ new Map();
	const inflight = /* @__PURE__ */ new Set();
	const sheet = Effect.fnUntraced(function* (ids = [...usedBy.keys()]) {
		return yield* renderSheet(ids.flatMap((id) => usedBy.get(id)?.split("\n") ?? []));
	});
	const reloadSheet = Effect.fnUntraced(function* () {
		yield* Effect.sync(() => {
			const env = server?.environments.client;
			const mod = env?.moduleGraph.getModuleById(SHEET);
			if (!env || !mod) return;
			env.moduleGraph.invalidateModule(mod);
			env.reloadModule(mod);
		});
	});
	const record = Effect.fnUntraced(function* (id, classes) {
		const s = [...new Set(classes)].sort().join("\n");
		if (usedBy.get(id) === s) return;
		usedBy.set(id, s);
		yield* reloadSheet();
	});
	const runnerDeps = (env, id, out = /* @__PURE__ */ new Set(), seen = /* @__PURE__ */ new Set()) => {
		const mod = env.moduleGraph.getModuleById(id);
		if (!mod || seen.has(id)) return out;
		seen.add(id);
		for (const dep of mod.importedModules) {
			if (!dep.file || dep.file.includes("node_modules")) continue;
			out.add(dep.file);
			runnerDeps(env, dep.id ?? "", out, seen);
		}
		return out;
	};
	const flushWarnings = Effect.fnUntraced(function* (warn, file) {
		const { warnings } = yield* Registry;
		const ws = warnings.splice(0);
		yield* Effect.sync(() => ws.forEach(warn));
		yield* warned(ws, file);
	});
	const clientTransform = Effect.fn("cssints.clientTransform")(function* (code, id, parsed, env, warn) {
		const recorded = Effect.fnUntraced(function* (sites) {
			let runtimes = [];
			if (parsed.sites.every((_, n) => sites.has(n))) {
				const registry = yield* Registry;
				const { rules, properties, themed } = registry;
				const texts = [...sites.values()];
				const classes = texts.flatMap((r) => [...r.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g)].flatMap((m) => m[1].split(" ")));
				const kernels = kernelEntries(registry, id);
				const names = new Set([...texts, ...kernels].flatMap((r) => r.match(/--[\w-]+/g) ?? []));
				globalNames(themed, id).forEach((n) => names.add(n));
				for (const c of classes) rules.get(c)?.tokens?.forEach((n) => names.add(n));
				closeNames(names, registry.defs, themed);
				yield* record(id, [
					...classes,
					...[...names].flatMap((n) => properties.get(n)?.css ?? []),
					...themedEntries(themed, id, names),
					...kernels,
					...globalEntries(registry, id),
					...layerEntries(registry, id),
					...yield* fallbackEntries(registry, id)
				]);
				runtimes = runtimeNames(registry, id);
				if (!runtimes.includes("derived") && usesDerived(registry, names)) runtimes.push(DERIVED);
			}
			return {
				sites,
				runtimes
			};
		});
		const { sites, runtimes } = parsed.sites.length ? yield* evaluate(runner, id, recorded).pipe(Effect.ensuring(flushWarnings(warn, id))) : yield* Effect.sync(() => forget(id)).pipe(Effect.andThen(recorded(/* @__PURE__ */ new Map())));
		const ms = new MagicString(code);
		if (runtimes.length) ms.prepend(runtimes.map((n) => `import ${Formatter.formatJson(RUNTIME_ID + n)};\n`).join(""));
		for (const [n, s] of parsed.sites.entries()) {
			const replacement = sites.get(n);
			if (replacement === void 0) return yield* new SiteMissingError({
				message: `cssints: site ${n} in ${id} was not evaluated`,
				file: id,
				site: n,
				offset: s.start
			});
			ms.overwrite(s.start, s.end, replacement);
		}
		for (const decl of parsed.imp.decls) {
			const kept = keptImport(decl, code);
			if (kept) ms.overwrite(decl.start, decl.end, kept);
			else ms.remove(decl.start, decl.end);
		}
		for (const dep of runnerDeps(env, id)) (depsOf.get(dep) ?? depsOf.set(dep, /* @__PURE__ */ new Set()).get(dep)).add(id);
		return {
			code: ms.toString(),
			map: ms.generateMap({
				hires: true,
				source: id,
				includeContent: true
			})
		};
	});
	const inertJsx = Effect.fn("cssints.inertJsx")(function* (code, id) {
		const jsx = {
			runtime: "classic",
			pragma: "__jsx",
			pragmaFrag: "__jsx"
		};
		return yield* Effect.tryPromise({
			try: () => transformWithOxc(code, id, { jsx }).then((r) => r.code),
			catch: (cause) => new HookError({
				hook: "transform",
				message: `cssints: ${String(cause)}`,
				cause
			})
		});
	});
	const transform = Effect.fn("cssints.transform")(function* (ctx, code, url) {
		const id = url.replace(VERSION, "");
		if (!FILE_RE.test(id)) return void 0;
		if (!marked(code, id)) return ctx.environment.name === "ssr" && /[jt]sx$/.test(id) && !id.includes("node_modules") ? yield* inertJsx(code, id) : void 0;
		if (ctx.environment.name === "ssr") {
			const out = yield* instrument(code, id);
			return out && /x$/.test(id) ? yield* inertJsx(out.code, id) : out?.code;
		}
		if (inner) return void 0;
		const parsed = yield* instrument(code, id);
		if (!parsed) return void 0;
		const env = server.environments.ssr;
		runner ??= createServerModuleRunner(env, {
			hmr: false,
			sourcemapInterceptor: "prepareStackTrace",
			evaluator: new DomEvaluator()
		});
		inflight.add(id);
		return yield* clientTransform(code, id, parsed, env, (w) => ctx.warn(w)).pipe(Effect.ensuring(Effect.sync(() => inflight.delete(id))));
	});
	const startServer = Effect.fn("cssints.buildStart")(function* () {
		server = yield* Effect.tryPromise({
			try: () => createServer({
				configFile: false,
				root,
				logLevel: "warn",
				server: {
					middlewareMode: true,
					watch: null,
					hmr: false
				},
				optimizeDeps: { noDiscovery: true },
				plugins: [cssints({ inner: true })]
			}),
			catch: (cause) => new HookError({
				hook: "buildStart",
				message: `cssints: could not start the evaluation server: ${String(cause)}`,
				cause
			})
		});
		ownServer = true;
	});
	const stopServer = Effect.fn("cssints.closeBundle")(function* () {
		if (!ownServer || !server) return;
		const s = server;
		yield* Effect.tryPromise({
			try: () => s.close(),
			catch: (cause) => new HookError({
				hook: "closeBundle",
				message: `cssints: could not stop the evaluation server: ${String(cause)}`,
				cause
			})
		});
	});
	const renderChunk = Effect.fn("cssints.renderChunk")(function* (ctx, chunk) {
		if (inner || !Object.hasOwn(chunk.modules, SHEET)) return null;
		const [css, cssPost] = cssPlugins;
		const text = yield* sheet();
		const via = (plugin, code) => Effect.tryPromise({
			try: () => callTransform(plugin, ctx, code),
			catch: (cause) => new HookError({
				hook: "renderChunk",
				message: `cssints: the sheet failed in Vite's CSS pipeline: ${String(cause)}`,
				cause
			})
		});
		yield* via(cssPost, (yield* via(css, text).pipe(Effect.withSpan("cssints.lightningcss")))?.code ?? text).pipe(Effect.withSpan("cssints.cssPost"));
		return null;
	});
	const buildEnd = Effect.fn("cssints.buildEnd")(function* (warn) {
		yield* verifyChecks(() => true).pipe(Effect.catch((e) => locate(e, "", "")), Effect.ensuring(flushWarnings(warn)));
	});
	const hotUpdate = Effect.fn("cssints.hotUpdate")(function* (env, file, modules) {
		if (env.name !== "client") return void 0;
		const { warned } = yield* Registry;
		yield* Effect.sync(() => warned.clear());
		const graph = env.moduleGraph;
		const affected = [.../* @__PURE__ */ new Set([...depsOf.get(file) ?? [], ...inflight])].flatMap((id) => graph.getModuleById(id) ?? []);
		yield* Effect.sync(() => affected.forEach((m) => {
			graph.invalidateModule(m);
			if (m.id) forget(m.id);
		}));
		return [...modules, ...affected];
	});
	return [{
		name: "cssints",
		enforce: "pre",
		config(user) {
			const names = Effect.runSync(packagesOnCssints(resolve(user.root ?? process.cwd())));
			return {
				optimizeDeps: { exclude: names },
				ssr: { noExternal: names }
			};
		},
		api: { sheet: (ids) => Effect.runSync(sheet(ids)) },
		configResolved(config) {
			build = config.command === "build";
			root = config.root;
			cssPlugins = ["vite:css", "vite:css-post"].map((n) => config.plugins.find((p) => p.name === n));
		},
		configureServer(s) {
			server = s;
			if (inner) return;
			s.environments.client.hot.on("cssints:sheet", (v) => {
				if (!s.environments.client.moduleGraph.getModuleById(SHEET)?.transformResult?.code.includes(v)) Effect.runSync(reloadSheet());
			});
		},
		buildStart() {
			if (inner || server) return;
			return run(hook("vite.buildStart", root, startServer()));
		},
		buildEnd() {
			if (build && !inner) return run(hook("vite.buildEnd", root, buildEnd((w) => this.warn(w))));
		},
		closeBundle() {
			return run(hook("vite.closeBundle", root, stopServer())).then(() => inner ? void 0 : closeTrace());
		},
		resolveId(id) {
			if (id === SHEET_IMPORT) return SHEET;
			if (id.startsWith("virtual:cssints/runtime/")) return `\0${id}`;
		},
		load(id) {
			if (id === SHEET) return build ? LAYERS : runSync(hook("vite.load", id, sheet()));
			if (id.startsWith(`\0virtual:cssints/runtime/`)) return runSync(runtimeModule(id.slice(RUNTIME_ID.length + 1)));
		},
		renderChunk(_, chunk) {
			return run(hook("vite.renderChunk", chunk.fileName, renderChunk(this, chunk)));
		},
		transform: {
			order: "pre",
			handler(code, id) {
				return run(hook("vite.transform", id, transform(this, code, id).pipe(Effect.catch((e) => locate(e, code, id))), this.environment.name));
			}
		},
		hotUpdate({ file, modules }) {
			return runSync(hook("vite.hotUpdate", file, hotUpdate(this.environment, file, modules)));
		}
	}, {
		name: "cssints:sheet-version",
		apply: "serve",
		transform: {
			order: "post",
			handler(code, id) {
				if (id === SHEET && this.environment.name === "client") return `${code}\nimport.meta.hot.send("cssints:sheet", ${Formatter.formatJson(hash(code))});`;
			}
		}
	}];
}
const callTransform = (plugin, ctx, code) => {
	const t = plugin?.transform;
	const handler = typeof t === "function" ? t : t?.handler;
	return Promise.resolve(handler?.call(ctx, code, SHEET));
};
//#endregion
export { addGlobal, addLayers, cssTarget, cssints as default, globalEntries, instrument, layerEntries, renderSheet, targets };
