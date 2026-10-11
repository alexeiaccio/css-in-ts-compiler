import { u as ImportError } from "./registry-CTumHB8p.mjs";
import { Effect, Formatter, Predicate } from "effect";
import { parseSync } from "oxc-parser";
import MagicString from "magic-string";
//#region src/instrument.ts
const RUNTIME = "cssints";
const CV_CALL = "__cv(";
const CX_CALL = "__cx(";
const rootIdent = (n) => n.type === "Identifier" ? n.name : n.type === "MemberExpression" ? rootIdent(n.object) : n.type === "CallExpression" ? rootIdent(n.callee) : null;
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
const findCssImport = Effect.fnUntraced(function* (program, code, id, client) {
	const plain = (name) => !client && TYPED_OM.has(name);
	const locals = /* @__PURE__ */ new Set();
	const decls = [];
	for (const s of program.body) {
		if (s.type !== "ImportDeclaration") continue;
		const old = s.source.value === "cssints" && s.specifiers.find((x) => importedName(x) === "_cv");
		const gone = s.source.value === "cssints" && s.specifiers.find((x) => importedName(x) === "cx");
		if (gone) return yield* new ImportError({
			message: `cssints: ${id} imports cx from "cssints", which is gone: cn(...) takes runtime values now. Write cn(base, on && p(4)) with cn from "cssints" with { type: "cssints" }; for the SVG property, css.cx(...)`,
			file: id,
			offset: gone.start
		});
		if (old) return yield* new ImportError({
			message: `cssints: ${id} imports _cv from "cssints", which is gone: cv({ ... }) is the function now. Write const button = cv({ base, variants }) (cv from "cssints" with { type: "cssints" }), drop _cv, and call button({ size: "lg" })`,
			file: id,
			offset: old.start
		});
		if (isSiteImport(s)) {
			decls.push(s);
			s.specifiers.forEach((x) => locals.add(x.local.name));
		} else if (s.source.value === "cssints" && s.importKind !== "type") {
			const bad = s.specifiers.filter((x) => x.type !== "ImportSpecifier" || x.importKind !== "type" && !plain(importedName(x) ?? ""));
			if (!bad.length) continue;
			const names = bad.map((x) => code.slice(x.start, x.end));
			const fix = bad[0].type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
			return yield* new ImportError({
				message: `cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }`,
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
const isRuntimeArg = (arg, code, scope, roots) => {
	const a = arg.type === "SpreadElement" ? arg.argument : arg;
	const todo = [a];
	for (const n of todo) if (n.type === "CallExpression") {
		if (!roots.has(rootIdent(n.callee) ?? "")) return true;
	} else if (n.type === "LogicalExpression") todo.push(n.left, n.right);
	else if (n.type === "ConditionalExpression") todo.push(n.consequent, n.alternate);
	else if (n.type === "ArrayExpression") n.elements.forEach((e) => e && todo.push(e));
	else if (n.type === "ParenthesizedExpression") todo.push(n.expression);
	return a.type === "TemplateLiteral" || a.type === "Literal" && typeof a.value === "string" || !!code.slice(a.start, a.end).match(/[\p{L}\p{N}_$]+/gu)?.some((w) => scope.has(w));
};
function findSites(program, code, locals, cn, spaces) {
	const sites = [];
	const scopes = [/* @__PURE__ */ new Set()];
	const walk = (node, inFn) => {
		if (!Predicate.isObject(node) || typeof node.type !== "string") return;
		const n = node;
		if ((n.type === "CallExpression" || n.type === "NewExpression") && locals.has(rootIdent(n.callee) ?? "")) {
			const scope = scopes[scopes.length - 1];
			const c = n.type === "CallExpression" ? n.callee : void 0;
			const isCn = c?.type === "Identifier" ? cn.has(c.name) : c?.type === "MemberExpression" && !c.computed && c.property.type === "Identifier" && c.property.name === "cn" && c.object.type === "Identifier" && spaces.has(c.object.name);
			const args = n.type === "CallExpression" && isCn ? n.arguments : [];
			const runtime = args.map((a) => isRuntimeArg(a, code, scope, locals));
			if (!runtime.includes(true)) {
				sites.push({
					start: n.start,
					end: n.end,
					inFn,
					locals: scope
				});
				return;
			}
			const from = sites.length;
			args.forEach((a, i) => runtime[i] && walk(a, inFn));
			sites.push({
				start: n.start,
				end: n.end,
				inFn,
				locals: scope,
				group: {
					callee: {
						start: n.callee.start,
						end: n.callee.end
					},
					args: args.map((a, i) => ({
						start: a.start,
						end: a.end,
						runtime: runtime[i]
					})),
					parts: sites.slice(from).map((x, k) => [x.start, from + k])
				}
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
const writeSite = (ms, s, replacement) => {
	const kept = s.group?.args.filter((a) => a.runtime);
	if (!kept) return ms.overwrite(s.start, s.end, replacement);
	ms.overwrite(s.start, kept[0].start, replacement);
	kept.slice(1).forEach((a, i) => ms.overwrite(kept[i].end, a.start, ", "));
	ms.overwrite(kept.at(-1).end, s.end, ")");
};
const runtimeImport = (replacements) => {
	const all = [...replacements];
	const names = [...all.some((r) => r.startsWith("__cv(")) ? ["_cv as __cv"] : [], ...all.some((r) => r.startsWith("__cx(")) ? ["_cx as __cx"] : []];
	return names.length ? `import { ${names.join(", ")} } from ${Formatter.formatJson(RUNTIME)};\n` : "";
};
const instrument = Effect.fn("cssints.instrument")(function* (code, id, client = true) {
	const { program } = parseSync(id, code);
	const imp = yield* findCssImport(program, code, id, client);
	if (!imp) return null;
	const sources = imp.decls.filter((d) => d.source.value === RUNTIME);
	const cn = /* @__PURE__ */ new Set();
	const spaces = /* @__PURE__ */ new Set();
	for (const d of sources) for (const x of d.specifiers) if (x.type === "ImportNamespaceSpecifier" || importedName(x) === "css") spaces.add(x.local.name);
	else if (importedName(x) === "cn") cn.add(x.local.name);
	const sites = findSites(program, code, withConditions(program, code, imp), cn, spaces);
	const ms = new MagicString(code);
	const hoisted = [];
	const file = Formatter.formatJson(id);
	sites.forEach((s, n) => {
		const site = `__site(__at(${file}, ${n}, ${s.start}), `;
		const expr = code.slice(s.start, s.end);
		if (s.group) {
			const statics = s.group.args.flatMap((a) => {
				if (a.runtime) return [];
				const text = code.slice(a.start, a.end);
				return [text.startsWith("...") ? `...[${text}].map((s) => [${a.start}, s])` : `[${a.start}, ${text}]`];
			});
			if (!s.inFn) ms.overwrite(s.group.callee.start, s.group.callee.end, "__nocn");
			hoisted.push(`${site}__group([${statics.join(", ")}], ${Formatter.formatJson(s.group.parts)}));`);
		} else if (s.inFn) {
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
		const bind = ns ? ns.local.name : `{ ${d.specifiers.map((x) => `${Formatter.formatJson(importedName(x))}: ${x.local.name}`).join(", ")} }`;
		ms.overwrite(d.start, d.end, `import { css as __css${i} } from ${Formatter.formatJson(RUNTIME)}; const ${bind} = __css${i};`);
	});
	ms.prepend(`import { __at, __group, __nocn, __site, __unseen } from ${Formatter.formatJson(RUNTIME)};\n`);
	if (hoisted.length) ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
	return {
		code: ms.toString(),
		sites,
		imp
	};
});
//#endregion
export { runtimeImport as a, instrument as i, CX_CALL as n, writeSite as o, RUNTIME as r, CV_CALL as t };
