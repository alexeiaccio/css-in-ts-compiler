import { c as EvalError, d as MacroError, f as MemberError, i as forgetWarnings, l as HookError, n as forget, p as SiteMissingError, t as Registry } from "./registry-BUSEO32-.mjs";
import { C as fallbackEntries, T as runtimeNames, a as closeNames, b as DERIVED, c as layerEntries, f as themedEntries, l as layerStatements, m as usesDerived, n as addGlobal, o as globalEntries, r as addLayers, s as globalNames, t as LAYERS, u as renderSheet, v as kernelEntries, w as runtimeModule, x as RUNTIME_ID } from "./sheet-BeHdq4xt.mjs";
import { a as runtimeImport, i as instrument, o as writeSite } from "./instrument-Bg2yhV0s.mjs";
import { r as verifyChecks } from "./contrast-B49XCnVX.mjs";
import { createRequire } from "node:module";
import { targets as targets$1, useTargets } from "@cssints/css-grammar/support";
import { Cause, Clock, Config, Data, Effect, Exit, Formatter, Option, Predicate, Result, Schema, Semaphore } from "effect";
import { createHash } from "node:crypto";
import { basename, join, relative, resolve, sep } from "node:path";
import { browserslistToTargets } from "lightningcss";
import MagicString from "magic-string";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { browsers as browsers$1 } from "@cssints/css-grammar/browsers";
import { createFilter, createServer, createServerModuleRunner, normalizePath, transformWithOxc } from "vite";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import { ESModulesEvaluator, ssrModuleExportsKey } from "vite/module-runner";
import { gzipSync } from "node:zlib";
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
	const message = e instanceof Error ? e.message : String(e);
	if (!at) return new EvalError({
		file: id,
		message,
		cause: e
	});
	const m = e instanceof ReferenceError ? /^(?:(\S+) is not defined|Cannot access '(\S+)' before initialization)$/.exec(e.message) : null;
	const name = m?.[1] ?? m?.[2];
	return new MacroError({
		message: name ? `cssints: css arguments must be known at build time: \`${name}\` is not defined where the call is evaluated (a parameter, a prop or state). Use cn(base, on && p(4)), a cv variant, or a token in a style prop` : message,
		cause: e,
		...at
	});
};
const evaluateModule = Effect.fnUntraced(function* (runner, id, targets) {
	const registry = yield* Registry;
	useTargets(targets);
	registry.sites.delete(id);
	registry.nodes.delete(id);
	forget(id);
	registry.at = void 0;
	registry.files.clear();
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
/**
* Evaluates `id` for the browser `targets` (default: those of process.cwd()) and runs `whileLocked` on its sites before
* the next evaluation may start (runner.qnt `rules`).
*/
const evaluate = Effect.fn("cssints.evaluate")(function* (runner, id, whileLocked, targets) {
	return yield* evalLock.withPermit(evaluateModule(runner, id, targets).pipe(Effect.flatMap(whileLocked)));
});
//#endregion
//#region src/devtools-server.ts
const DEVTOOLS_ID = "virtual:cssints/devtools";
const RESOLVED = `\0${DEVTOOLS_ID}`;
const SHEET$1 = "\0virtual:cssints.css";
const GROUP = /^_g(-[\w-]+)?$/;
const table = Effect.fn("cssints.devtoolsTable")(function* (root, usedBy, callsOf) {
	const { rules, kernels, defs, scopes, layers } = yield* Registry;
	const entries = [...new Set([...usedBy.values()].flatMap((s) => s.split("\n")))];
	const sheet = yield* renderSheet(entries);
	const classes = {};
	for (const cls of entries) {
		const r = rules.get(cls);
		if (!r) continue;
		const scope = r.prop.startsWith("--") ? [...scopes.keys()].find((s) => r.prop.startsWith(`--${s}-`)) : void 0;
		classes[cls] = {
			kind: "class",
			layer: r.layer,
			wrap: r.wrap,
			prop: r.prop,
			css: r.css,
			tokens: r.tokens ?? [],
			...scope ? { plugin: scope } : {},
			sites: []
		};
	}
	for (const [key, k] of kernels) for (const m of k.markers) classes[m] = {
		kind: "marker",
		layer: "_.k",
		wrap: [],
		prop: "",
		css: k.kernel.css,
		tokens: [],
		plugin: key,
		sites: []
	};
	const sites = [];
	for (const [file, calls] of callsOf) {
		if (!usedBy.has(file)) continue;
		for (const call of calls) {
			const known = call.classes.filter((c) => {
				if (!classes[c] && GROUP.test(c)) classes[c] = {
					kind: "group",
					layer: "",
					wrap: [],
					prop: "",
					css: "",
					tokens: [],
					sites: []
				};
				return !!classes[c];
			});
			if (!known.length) continue;
			const n = sites.push({
				...call,
				file,
				classes: known
			}) - 1;
			for (const c of known) classes[c].sites.push(n);
		}
	}
	const tokens = {};
	for (const [name, d] of defs) tokens[name] = {
		path: d.path,
		value: d.value
	};
	const statements = (before) => layerStatements([...layers.values()].flatMap((l) => l.before === before ? [l.names] : []));
	const engine = LAYERS.slice(7, -1).split(", ");
	const order = [
		...statements(true).flat(),
		...engine,
		...statements(false).flat()
	];
	return {
		root,
		sheet,
		layers: [...new Set(order)],
		classes,
		sites,
		tokens
	};
});
const ASK = "cssints:devtools:ask";
const ASKED = "cssints:devtools:asked";
const MAX_PROMPT = 16e3;
const Asking = Schema.Struct({
	ref: Schema.Finite,
	prompt: Schema.String
});
var OpenCodeError = class extends Data.TaggedError("OpenCodeError") {};
const workspace = (root) => root.split(sep).map((_, i, parts) => parts.slice(0, parts.length - i).join(sep) || sep).find((dir) => existsSync(join(dir, ".git"))) ?? root;
const connect = Effect.fn("cssints.opencodeConnect")(function* () {
	const unavailable = (message) => () => new OpenCodeError({
		status: "unavailable",
		message
	});
	const { OpenCode } = yield* Effect.tryPromise({
		try: () => import("@opencode/client"),
		catch: unavailable("opencode is on, but @opencode/client is not installed: add it to the devDependencies of the app")
	});
	const { Service } = yield* Effect.tryPromise({
		try: () => import("@opencode/client/service"),
		catch: unavailable("opencode is on, but @opencode/client is not installed: add it to the devDependencies of the app")
	});
	const service = yield* Effect.tryPromise({
		try: () => Service.discover(),
		catch: (e) => unavailable(Predicate.isError(e) ? e.message : String(e))()
	});
	if (!service) return yield* new OpenCodeError({
		status: "unavailable",
		message: "No OpenCode service is running. Start OpenCode (or `opencode serve --service`) and send again."
	});
	return OpenCode.make({
		baseUrl: service.url,
		headers: Service.headers(service)
	});
});
const ask = Effect.fn("cssints.opencodeAsk")(function* (root, options, ref, prompt, say) {
	const client = yield* connect();
	const call = (f) => Effect.tryPromise({
		try: f,
		catch: (e) => new OpenCodeError({
			status: "failed",
			message: Predicate.isError(e) ? e.message : String(e)
		})
	});
	const { id } = yield* call(() => client.session.create({
		title: "cssints devtools: UI change",
		...options.agent ? { agent: options.agent } : {},
		location: { directory: workspace(root) }
	}));
	say({
		ref,
		status: "running",
		id
	});
	yield* call(() => client.session.prompt({
		sessionID: id,
		text: prompt.slice(0, MAX_PROMPT),
		...options.skills?.length ? { skills: options.skills.map((s) => ({ id: s })) } : {}
	}));
	yield* call(() => client.session.wait({ sessionID: id }));
	const { outcome } = yield* call(() => client.session.get({ sessionID: id }));
	say({
		ref,
		status: outcome === "succeeded" ? "completed" : outcome ?? "failed",
		id
	});
});
const entryModule = (overlay, root, opencode) => overlay ? `import { mount } from ${Formatter.formatJson(overlay)};
const hot = import.meta.hot;
mount({
  root: ${Formatter.formatJson(root)},
  request: () => hot.send("cssints:devtools:get"),
  on: (event, listener) => hot.on(event, listener),${opencode ? `\n  ask: (ref, prompt) => hot.send("${ASK}", { ref, prompt }),` : ""}
});
` : `console.warn("cssints: devtools is on, but @cssints/devtools/overlay is not installed (or not built): add @cssints/devtools to the devDependencies of the app");\n`;
/**
* The dev-only plugin of `cssints({ devtools: true })`: the overlay's entry in every HTML page, and the table on request.
* `apply: "serve"`, so a build has none of it.
* @param {Map<string, string>} usedBy the entries of each client module (plugin.ts)
* @param {Map<string, DevSite[]>} callsOf the sites of each client module
* @param {OpenCodeOptions | undefined} opencode set: the overlay's prompt box starts OpenCode sessions through this server
* @returns {Plugin} the plugin
*/
const devtoolsPlugin = (usedBy, callsOf, opencode) => {
	let server;
	const stale = () => Effect.sync(() => server?.environments.client.hot.send("cssints:devtools:stale"));
	const entry = Effect.fn("cssints.devtoolsEntry")(function* (resolve) {
		const overlay = yield* Effect.tryPromise(resolve).pipe(Effect.orElseSucceed(() => null));
		return entryModule(overlay?.id, server?.config.root ?? "", !!opencode);
	});
	return {
		name: "cssints:devtools",
		apply: "serve",
		configureServer(s) {
			server = s;
			s.environments.client.hot.on("cssints:devtools:get", (_, client) => client.send("cssints:devtools", Effect.runSync(table(s.config.root, usedBy, callsOf))));
			if (opencode) s.environments.client.hot.on(ASK, (data) => {
				const asking = Schema.decodeUnknownOption(Asking)(data);
				if (Option.isNone(asking)) return;
				const { ref, prompt } = asking.value;
				const say = (asked) => s.environments.client.hot.send(ASKED, asked);
				Effect.runFork(ask(s.config.root, opencode, ref, prompt, say).pipe(Effect.catchTag("OpenCodeError", (e) => Effect.sync(() => say({
					ref,
					status: e.status,
					message: e.message
				})))));
			});
		},
		transformIndexHtml: () => [{
			tag: "script",
			attrs: {
				type: "module",
				src: `/@id/${DEVTOOLS_ID}`
			},
			injectTo: "body"
		}],
		resolveId(id) {
			if (id === "virtual:cssints/devtools") return RESOLVED;
		},
		load(id) {
			if (id !== RESOLVED) return;
			return Effect.runPromise(entry(() => this.resolve("@cssints/devtools/overlay", void 0, { skipSelf: true })));
		},
		transform: {
			order: "post",
			handler(_, id) {
				if (this.environment.name === "client" && (id === SHEET$1 || callsOf.has(id))) Effect.runSync(stale());
			}
		}
	};
};
const TABLE_FILE = "__CSSINTS_DEVTOOLS_TABLE__";
const loaderModule = (overlay, base) => `const key = (e) => {
  if (e.altKey && e.shiftKey && e.code === "KeyC") {
    e.preventDefault();
    open();
  }
};
const button = document.createElement("button");
button.textContent = "cssints";
button.title = "cssints devtools (Alt+Shift+C)";
button.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:4px 8px;border:1px solid #374151;border-radius:999px;background:#111827;color:#e5e7eb;font:11px ui-monospace,monospace;cursor:pointer;opacity:.75";
button.onclick = () => open();
const open = () => {
  button.remove();
  removeEventListener("keydown", key, true);
  import(${Formatter.formatJson(overlay)}).then(({ mount }) => {
    const listeners = {};
    mount({
      root: "",
      build: true,
      request: () => fetch(new URL(${Formatter.formatJson(base)} + "${TABLE_FILE}", document.baseURI))
        .then((r) => r.json())
        .then((table) => listeners["cssints:devtools"]?.(table)),
      on: (event, listener) => { listeners[event] = listener; },
    });
  });
};
addEventListener("keydown", key, true);
document.body.append(button);
`;
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
/**
* The build side of `cssints({ devtools: "build" })`: the overlay in every page behind a button, the table as a JSON asset.
* Nothing loads until the first open. The files of the sites are relative to the root, so the asset holds no path of this machine.
* @param {Map<string, string>} usedBy the entries of each client module (plugin.ts)
* @param {Map<string, DevSite[]>} callsOf the sites of each client module
* @returns {Plugin} the plugin
*/
const devtoolsBuildPlugin = (usedBy, callsOf) => ({
	name: "cssints:devtools-build",
	apply: "build",
	transformIndexHtml: {
		order: "pre",
		handler: () => [{
			tag: "script",
			attrs: {
				type: "module",
				src: DEVTOOLS_ID
			},
			injectTo: "body"
		}]
	},
	resolveId(id) {
		if (id === "virtual:cssints/devtools") return RESOLVED;
	},
	load(id) {
		if (id !== RESOLVED) return;
		return Effect.runPromise(Effect.tryPromise(() => this.resolve("@cssints/devtools/overlay", void 0, { skipSelf: true })).pipe(Effect.orElseSucceed(() => null), Effect.map((overlay) => overlay ? loaderModule(overlay.id, this.environment.config.base) : `console.warn("cssints: devtools is on, but @cssints/devtools/overlay is not installed: add @cssints/devtools to the devDependencies of the app");\n`)));
	},
	generateBundle(_, bundle) {
		if (this.environment.name !== "client") return;
		const chunks = Object.values(bundle).flatMap((f) => f.type === "chunk" ? [f] : []);
		const loader = chunks.find((c) => c.code.includes(TABLE_FILE));
		if (!loader) return;
		const { root } = this.environment.config;
		const t = Effect.runSync(table(root, usedBy, callsOf));
		const json = Formatter.formatJson({
			...t,
			root: "",
			sites: t.sites.map((s) => ({
				...s,
				file: relative(root, s.file)
			}))
		});
		const ref = this.emitFile({
			type: "asset",
			name: "cssints-devtools.json",
			source: json
		});
		const file = this.getFileName(ref);
		loader.code = loader.code.replace(TABLE_FILE, () => file);
		const overlay = chunks.find((c) => c.isDynamicEntry && c.code.includes("cssints-devtools"));
		this.info(`devtools: ${file} ${kb(Buffer.byteLength(json))} (${kb(gzipSync(json).length)} gzip)` + (overlay ? `, ${overlay.fileName} ${kb(Buffer.byteLength(overlay.code))} (${kb(gzipSync(overlay.code).length)} gzip), loaded on the first open` : ""));
	}
});
//#endregion
//#region src/entries.ts
const moduleEntries = Effect.fnUntraced(function* (id, sites) {
	const registry = yield* Registry;
	const { rules, properties, themed } = registry;
	const texts = [...sites.values()];
	const classes = texts.flatMap((r) => [...r.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g)].flatMap((m) => m[1].split(" ")));
	const kernels = kernelEntries(registry, id);
	const names = new Set([...texts, ...kernels].flatMap((r) => r.match(/--[\w-]+/g) ?? []));
	globalNames(themed, id).forEach((n) => names.add(n));
	for (const c of classes) rules.get(c)?.tokens?.forEach((n) => names.add(n));
	closeNames(names, registry.defs, themed);
	const entries = [
		...classes,
		...[...names].flatMap((n) => properties.get(n)?.css ?? []),
		...themedEntries(themed, id, names),
		...kernels,
		...globalEntries(registry, id),
		...layerEntries(registry, id),
		...yield* fallbackEntries(registry, id)
	];
	const runtimes = runtimeNames(registry, id);
	if (!runtimes.includes("derived") && usesDerived(registry, names)) runtimes.push(DERIVED);
	return {
		entries,
		runtimes
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
/**
* LightningCSS targets (css.lightningcss.targets) from the browserslist config of process.cwd(), read when vite.config.ts
* imports this module: the support warnings read the one of the Vite root, the same unless the root is elsewhere.
*/
const targets = browserslistToTargets(Effect.runSync(browsers$1()));
const ESBUILD = {
	ios_saf: "ios",
	ie: "ie",
	opera: "opera",
	edge: "edge",
	chrome: "chrome",
	firefox: "firefox",
	safari: "safari"
};
/** `build: { cssTarget }`, the browserslist query of `targets`, so a minified build keeps `firstThatWorks` fallbacks. */
const cssTarget = Effect.runSync(browsers$1()).flatMap((t) => {
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
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const vlq = (n) => {
	let v = n < 0 ? -n << 1 | 1 : n << 1;
	let s = "";
	do {
		const d = v & 31;
		v >>>= 5;
		s += B64[v ? d | 32 : d];
	} while (v);
	return s;
};
const sheetMap = (text, siteOf, source = (file) => file) => {
	const first = /* @__PURE__ */ new Map();
	for (const [file, at] of [...siteOf].sort(([a], [b]) => a < b ? -1 : 1)) for (const [cls, loc] of at) if (!first.has(cls)) first.set(cls, [file, loc]);
	const sources = [];
	let prev = [
		0,
		0,
		0
	];
	return {
		version: 3,
		sources,
		names: [],
		mappings: text.split("\n").map((l) => {
			const segs = [];
			let col = 0;
			let mapped = false;
			for (const m of l.matchAll(/(?<=^|[{};])\s*([^{};\s][^{};]*)(?=\{)/g)) {
				const at = m.index + m[0].length - m[1].length;
				const hit = [...m[1].matchAll(/\.(_[\w-]+)/g)].map((c) => first.get(c[1])).find(Boolean);
				if (!hit && !mapped) continue;
				let out = vlq(at - col);
				if (hit) {
					const [file, { line, column }] = hit;
					const name = source(file);
					const seg = [
						sources.includes(name) ? sources.indexOf(name) : sources.push(name) - 1,
						line - 1,
						column
					];
					out += seg.map((x, i) => vlq(x - prev[i])).join("");
					prev = seg;
				}
				segs.push(out);
				col = at;
				mapped = !!hit;
			}
			return segs.join(",");
		}).join(";")
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
function cssints({ inner = false, exclude, devtools = false, opencode = false } = {}) {
	const excluded = [exclude ?? []].flat().length ? createFilter(exclude) : () => false;
	let server;
	let ownServer = false;
	let runner;
	let build = false;
	let root = process.cwd();
	let rootTargets;
	let cssPlugins = [];
	let resolveOf = {};
	const usedBy = /* @__PURE__ */ new Map();
	const depsOf = /* @__PURE__ */ new Map();
	const inflight = /* @__PURE__ */ new Set();
	const siteOf = /* @__PURE__ */ new Map();
	let buildMap = false;
	const callsOf = /* @__PURE__ */ new Map();
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
	const drop = Effect.fnUntraced(function* (id) {
		if (!usedBy.delete(id)) return;
		forget(id);
		siteOf.delete(id);
		callsOf.delete(id);
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
	const flushWarnings = Effect.fnUntraced(function* (warn, id, code) {
		const { warnings } = yield* Registry;
		const ws = warnings.splice(0);
		for (const { message, at } of ws) {
			const file = at?.file ?? id;
			const text = at === void 0 ? void 0 : at.file === id ? code : yield* Effect.tryPromise(() => readFile(at.file, "utf8")).pipe(Effect.orElseSucceed(() => void 0));
			const loc = at && text !== void 0 ? {
				file: at.file,
				...lineCol(text, at.offset)
			} : void 0;
			yield* Effect.sync(() => warn({
				message,
				...file && { id: file },
				...loc && { loc }
			}));
		}
		yield* warned(ws.map((w) => w.message), id);
	});
	const clientTransform = Effect.fn("cssints.clientTransform")(function* (code, id, parsed, env, warn, watch) {
		const recorded = Effect.fnUntraced(function* (sites) {
			let runtimes = [];
			const files = parsed.sites.length ? [...(yield* Registry).files] : [];
			if (parsed.sites.every((_, n) => sites.has(n))) {
				const made = yield* moduleEntries(id, sites);
				yield* record(id, made.entries);
				runtimes = made.runtimes;
			}
			return {
				sites,
				runtimes,
				files
			};
		});
		const { sites, runtimes, files } = parsed.sites.length ? yield* evaluate(runner, id, recorded, rootTargets).pipe(Effect.ensuring(flushWarnings(warn, id, code))) : yield* Effect.sync(() => forget(id)).pipe(Effect.andThen(recorded(/* @__PURE__ */ new Map())));
		if (!build || buildMap || devtools === "build") {
			const at = /* @__PURE__ */ new Map();
			for (const [n, s] of parsed.sites.entries()) {
				const loc = lineCol(code, s.start);
				for (const m of sites.get(n)?.matchAll(/_[\w-]+/g) ?? []) if (!at.has(m[0])) at.set(m[0], loc);
			}
			siteOf.set(id, at);
			if (devtools) callsOf.set(id, parsed.sites.map((s, n) => ({
				...lineCol(code, s.start),
				classes: sites.get(n)?.match(/_[\w-]+/g) ?? [],
				text: code.slice(s.start, s.end)
			})));
		}
		const ms = new MagicString(code);
		if (runtimes.length) ms.prepend(runtimes.map((n) => `import ${Formatter.formatJson(RUNTIME_ID + n)};\n`).join(""));
		ms.prepend(runtimeImport(sites.values()));
		for (const [n, s] of parsed.sites.entries()) {
			const replacement = sites.get(n);
			if (replacement === void 0) return yield* new SiteMissingError({
				message: `cssints: site ${n} in ${id} was not evaluated`,
				file: id,
				site: n,
				offset: s.start
			});
			writeSite(ms, s, replacement);
		}
		for (const decl of parsed.imp.decls) ms.remove(decl.start, decl.end);
		for (const dep of runnerDeps(env, id)) (depsOf.get(dep) ?? depsOf.set(dep, /* @__PURE__ */ new Set()).get(dep)).add(id);
		for (const file of files) {
			const dep = normalizePath(resolve(file));
			(depsOf.get(dep) ?? depsOf.set(dep, /* @__PURE__ */ new Set()).get(dep)).add(id);
			yield* Effect.sync(() => watch(dep));
		}
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
		if (!FILE_RE.test(id) || excluded(id)) return void 0;
		if (!marked(code, id)) {
			if (ctx.environment.name === "client") yield* drop(id);
			return ctx.environment.name === "ssr" && (inner || !build) && /[jt]sx$/.test(id) && !id.includes("node_modules") ? yield* inertJsx(code, id) : void 0;
		}
		if (ctx.environment.name === "ssr" && (inner || !build)) {
			const out = yield* instrument(code, id, false);
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
		const watch = (file) => build ? ctx.addWatchFile(file) : void server.watcher.add(file);
		return yield* clientTransform(code, id, parsed, env, (w) => ctx.warn(w), watch).pipe(Effect.ensuring(Effect.sync(() => inflight.delete(id))));
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
				...resolveOf,
				plugins: [cssints({
					inner: true,
					exclude
				})]
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
		server = runner = void 0;
		ownServer = false;
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
	const emitMaps = Effect.fn("cssints.generateBundle")(function* (ctx, bundle, dir) {
		for (const asset of Object.values(bundle)) {
			if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
			const text = Predicate.isString(asset.source) ? asset.source : new TextDecoder().decode(asset.source);
			const at = resolve(dir, asset.fileName, "..");
			const map = {
				...sheetMap(text, siteOf, (file) => relative(at, file.replace(/\?.*/, ""))),
				file: basename(asset.fileName)
			};
			if (!map.sources.length) continue;
			const json = Formatter.formatJson(map);
			const url = buildMap === "inline" ? `data:application/json;base64,${Buffer.from(json).toString("base64")}` : `${map.file}.map`;
			if (buildMap !== "inline") yield* Effect.sync(() => ctx.emitFile({
				type: "asset",
				fileName: `${asset.fileName}.map`,
				source: json
			}));
			if (buildMap !== "hidden") asset.source = `${text}\n/*# sourceMappingURL=${url} */`;
		}
	});
	const buildEnd = Effect.fn("cssints.buildEnd")(function* (warn) {
		yield* verifyChecks(() => true).pipe(Effect.catch((e) => locate(e, "", "")), Effect.ensuring(flushWarnings(warn)));
	});
	const hotUpdate = Effect.fn("cssints.hotUpdate")(function* (env, file, modules, type) {
		if (env.name !== "client") return void 0;
		if (type === "delete") {
			yield* Effect.sync(() => forget(file));
			yield* drop(file);
		}
		yield* Effect.sync(() => forgetWarnings([file]));
		const graph = env.moduleGraph;
		const affected = [.../* @__PURE__ */ new Set([...depsOf.get(file) ?? [], ...inflight])].flatMap((id) => graph.getModuleById(id) ?? []);
		yield* Effect.sync(() => affected.forEach((m) => {
			graph.invalidateModule(m);
			if (m.id) forget(m.id);
		}));
		return [...modules, ...affected];
	});
	const main = {
		name: "cssints",
		enforce: "pre",
		config(user) {
			const names = Effect.runSync(packagesOnCssints(resolve(user.root ?? process.cwd())));
			return {
				optimizeDeps: { exclude: names },
				ssr: { noExternal: names }
			};
		},
		api: {
			sheet: (ids) => Effect.runSync(sheet(ids)),
			forgetWarnings: (files) => forgetWarnings(files)
		},
		configResolved(config) {
			build = config.command === "build";
			buildMap = build && !inner && config.build.sourcemap;
			root = config.root;
			if (!inner) rootTargets = Effect.runSync(targets$1(void 0, root));
			const ssr = config.environments.ssr?.resolve;
			resolveOf = {
				resolve: { alias: config.resolve.alias },
				...ssr && { environments: { ssr: { resolve: {
					conditions: ssr.conditions,
					externalConditions: ssr.externalConditions
				} } } }
			};
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
			if (inner) return;
			if (build) forgetWarnings();
			if (server) return;
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
			if (id === SHEET) {
				if (build) return LAYERS;
				const code = runSync(hook("vite.load", id, sheet()));
				return {
					code,
					map: sheetMap(code, siteOf)
				};
			}
			if (id.startsWith(`\0virtual:cssints/runtime/`)) return runSync(runtimeModule(id.slice(RUNTIME_ID.length + 1)));
		},
		renderChunk(_, chunk) {
			return run(hook("vite.renderChunk", chunk.fileName, renderChunk(this, chunk)));
		},
		generateBundle: {
			order: "post",
			handler(out, bundle) {
				if (buildMap) runSync(hook("vite.generateBundle", root, emitMaps(this, bundle, resolve(root, out.dir ?? "dist"))));
			}
		},
		transform: {
			order: "pre",
			handler(code, id) {
				return run(hook("vite.transform", id, transform(this, code, id).pipe(Effect.catch((e) => locate(e, code, id))), this.environment.name));
			}
		},
		hotUpdate({ file, modules, type }) {
			return runSync(hook("vite.hotUpdate", file, hotUpdate(this.environment, file, modules, type)));
		}
	};
	const version = {
		name: "cssints:sheet-version",
		apply: "serve",
		transform: {
			order: "post",
			handler(code, id) {
				if (id === SHEET && this.environment.name === "client") return `${code}\nimport.meta.hot.send("cssints:sheet", ${Formatter.formatJson(hash(code))});`;
			}
		}
	};
	if (!devtools || inner) return [main, version];
	const dev = devtoolsPlugin(usedBy, callsOf, opencode ? opencode === true ? {} : opencode : void 0);
	return devtools === "build" ? [
		main,
		version,
		dev,
		devtoolsBuildPlugin(usedBy, callsOf)
	] : [
		main,
		version,
		dev
	];
}
const callTransform = (plugin, ctx, code) => {
	const t = plugin?.transform;
	const handler = typeof t === "function" ? t : t?.handler;
	return Promise.resolve(handler?.call(ctx, code, SHEET));
};
//#endregion
export { addGlobal, addLayers, cssTarget, cssints as default, globalEntries, instrument, layerEntries, renderSheet, targets };
