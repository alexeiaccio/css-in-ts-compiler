import { u as ImportError } from "./registry-D-OHolzA.mjs";
import { Effect, Formatter, Predicate } from "effect";
import { parseSync } from "oxc-parser";
import MagicString from "magic-string";
//#region src/instrument.ts
const RUNTIME = "cssints";
const CV_CALL = "__cv(";
const rootIdent = (n) => n.type === "Identifier" ? n.name : n.type === "MemberExpression" ? rootIdent(n.object) : n.type === "CallExpression" ? rootIdent(n.callee) : null;
const RUNTIME_ONLY = /* @__PURE__ */ new Set(["cx"]);
const TYPED_OM = /* @__PURE__ */ new Set([
	"CSS",
	"CSSStyleValue",
	"CSSUnitValue",
	"CSSColorValue",
	"CSSImageValue"
]);
const nameOf = (m) => m.type === "Identifier" ? m.name : m.value;
const isSiteImport = (s) => s.attributes.some((a) => (a.key.type === "Identifier" ? a.key.name : a.key.value) === "type" && a.value.value === "cssints");
const importedName = (x) => x.type === "ImportSpecifier" ? nameOf(x.imported) : null;
const isRuntime = (d, x) => d.source.value === "cssints" && x.type === "ImportSpecifier" && RUNTIME_ONLY.has(nameOf(x.imported));
const keptImport = (d, code) => {
	const names = d.specifiers.filter((x) => isRuntime(d, x)).map((x) => code.slice(x.start, x.end));
	return names.length ? `import { ${names.join(", ")} } from ${Formatter.formatJson(RUNTIME)};` : "";
};
const findCssImport = Effect.fnUntraced(function* (program, code, id, client) {
	const plain = (name) => RUNTIME_ONLY.has(name) || !client && TYPED_OM.has(name);
	const locals = /* @__PURE__ */ new Set();
	const decls = [];
	for (const s of program.body) {
		if (s.type !== "ImportDeclaration") continue;
		const old = s.source.value === "cssints" && s.specifiers.find((x) => importedName(x) === "_cv");
		if (old) return yield* new ImportError({
			message: `cssints: ${id} imports _cv from "cssints", which is gone: cv({ ... }) is the function now. Write const button = cv({ base, variants }) (cv from "cssints" with { type: "cssints" }), drop _cv, and call button({ size: "lg" })`,
			file: id,
			offset: old.start
		});
		if (isSiteImport(s)) {
			decls.push(s);
			s.specifiers.forEach((x) => isRuntime(s, x) || locals.add(x.local.name));
		} else if (s.source.value === "cssints" && s.importKind !== "type") {
			const bad = s.specifiers.filter((x) => x.type !== "ImportSpecifier" || x.importKind !== "type" && !plain(importedName(x) ?? ""));
			if (!bad.length) continue;
			const names = bad.map((x) => code.slice(x.start, x.end));
			const fix = bad[0].type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
			return yield* new ImportError({
				message: `cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }; (only cx is runtime)`,
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
	else if (id.type === "RestElement") boundNames(id.argument, out);
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
const declsOf = (stmts, out) => stmts.forEach((s) => {
	if (s.type === "VariableDeclaration") s.declarations.forEach((d) => boundNames(d.id, out));
	else if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) out.add(s.id.name);
});
const declares = (n, out) => {
	if (n.type === "ArrowFunctionExpression" || n.type === "FunctionExpression" || n.type === "FunctionDeclaration") {
		n.params.forEach((p) => boundNames(p, out));
		if (n.type === "FunctionExpression" && n.id) out.add(n.id.name);
	} else if (n.type === "BlockStatement" || n.type === "StaticBlock") declsOf(n.body, out);
	else if (n.type === "SwitchCase") declsOf(n.consequent, out);
	else if (n.type === "ForStatement" && n.init) declsOf([n.init], out);
	else if (n.type === "ForInStatement" || n.type === "ForOfStatement") declsOf([n.left], out);
	else if (n.type === "CatchClause") boundNames(n.param, out);
};
function findSites(program, locals) {
	const sites = [];
	const scopes = [/* @__PURE__ */ new Set()];
	const walk = (node, inFn) => {
		if (!Predicate.isObject(node) || typeof node.type !== "string") return;
		const n = node;
		if ((n.type === "CallExpression" || n.type === "NewExpression") && locals.has(rootIdent(n.callee) ?? "")) {
			sites.push({
				start: n.start,
				end: n.end,
				inFn,
				locals: scopes[scopes.length - 1]
			});
			return;
		}
		const fn = inFn || /Function/.test(n.type);
		const own = /* @__PURE__ */ new Set();
		declares(n, own);
		scopes.push(own.size ? /* @__PURE__ */ new Set([...scopes[scopes.length - 1], ...own]) : scopes[scopes.length - 1]);
		for (const k in node) {
			const v = node[k];
			if (Array.isArray(v)) v.forEach((c) => walk(c, fn));
			else if (Predicate.isObject(v) && "type" in v) walk(v, fn);
		}
		scopes.pop();
	};
	walk(program, false);
	return sites;
}
const instrument = Effect.fn("cssints.instrument")(function* (code, id, client = true) {
	const { program } = parseSync(id, code);
	const imp = yield* findCssImport(program, code, id, client);
	if (!imp) return null;
	const sites = findSites(program, withConditions(program, code, imp));
	const ms = new MagicString(code);
	const hoisted = [];
	const file = Formatter.formatJson(id);
	sites.forEach((s, n) => {
		const site = `__site(__at(${file}, ${n}, ${s.start}), `;
		const expr = code.slice(s.start, s.end);
		if (s.inFn) {
			const names = new Set(expr.match(/[\p{L}\p{N}_$]+/gu));
			const dead = [...s.locals].filter((x) => names.has(x));
			hoisted.push(dead.length ? `{ ${site}${expr}); let ${dead.join(", ")}; }` : `${site}${expr});`);
		} else {
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
export { keptImport as i, RUNTIME as n, instrument as r, CV_CALL as t };
