/**
 * Generate Effect Schemas from ast.json — split into multiple modules.
 *
 * Each circular dependency group gets its own file with an object wrapper.
 * Non-recursive schemas go into individual files grouped by domain.
 * An index.ts re-exports everything.
 *
 * Output: src/generated/schemas/
 *
 * Usage: node scripts/generate-schemas.mjs
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const astJsonPath = join(root, "ast.json");
const outDir = join(root, "src", "generated", "schemas");

const BUILTIN = new Set(["String", "Number", "Boolean", "Null", "Unknown", "Never"]);

class SchemaCodegen {
	constructor(schema) {
		this.schema = schema;
		this.definitions = schema.definitions || {};
		this.circularGroups = this.findCircularGroups();
		this.inCircular = new Set(this.circularGroups.flat());
		this.groupFor = new Map();
		for (const group of this.circularGroups) {
			const groupName = group[0];
			for (const name of group) {
				this.groupFor.set(name, groupName);
			}
		}
		// Track which file each schema lives in
		this.fileFor = new Map();
	}

	/** Generate all files */
	generate() {
		mkdirSync(outDir, { recursive: true });
		mkdirSync(join(outDir, "circular"), { recursive: true });

		// 1. One file per circular group
		for (const group of this.circularGroups) {
			const groupName = this.groupFor.get(group[0]);
			const content = this.generateCircularFile(group, groupName);
			writeFileSync(join(outDir, `circular`, `${groupName}.ts`), content);
		}

		// 2. All non-recursive schemas in one file
		const sorted = this.topologicalSort();
		const nonCircular = sorted.filter(
			([name]) => !this.inCircular.has(name) && !name.startsWith("_") && name !== "DefaultAtRule",
		);

		const nonCircularContent = this.generateNonCircularFile(nonCircular);
		// Add DefaultAtRule stub (excluded from main generation)
		const stub = `\nexport const DefaultAtRuleSchema = Schema.Unknown\n`;
		writeFileSync(join(outDir, `non-recursive.ts`), nonCircularContent + stub);

		// 3. StyleSheet
		if (!this.definitions["StyleSheet"]) {
			const ssCode = this.expr(this.schema, "StyleSheet", false, "");
			const ruleImport =
				this.definitions["Rule"] && this.groupFor.has("Rule")
					? `import { Rule } from "./circular/${this.groupFor.get("Rule")}.js";`
					: `import { RuleSchema } from "./non-recursive.js";`;
			const ssContent = [
				`import { Schema } from "effect";`,
				ruleImport,
				`export const StyleSheetSchema = ${ssCode}`,
				"",
			].join("\n");
			writeFileSync(join(outDir, `root.ts`), ssContent);
		}

		// 4. index.ts — re-export everything
		const indexLines = [
			`/** Auto-generated — do not edit. */`,
			"",
			`export { ${nonCircular.map(([n]) => `${n}Schema`).join(", ")} } from "./non-recursive.js";`,
			"",
		];

		for (const g of this.circularGroups) {
			const gn = this.groupFor.get(g[0]);
			indexLines.push(`import { ${g.join(", ")} } from "./circular/${gn}.js";`);
		}
		for (const g of this.circularGroups) {
			for (const n of g) {
				indexLines.push(`export const ${n}Schema = ${n}`);
			}
		}
		indexLines.push(`export { ${this.circularGroups.flatMap((g) => g).join(", ")} }`);
		indexLines.push("");
		if (!this.definitions["StyleSheet"]) {
			indexLines.push(`export { StyleSheetSchema } from "./root.js";`);
		}
		indexLines.push("");

		writeFileSync(join(outDir, `index.ts`), indexLines.join("\n"));

		return { circular: this.circularGroups.length, nonCircular: nonCircular.length };
	}

	/** Generate the single non-recursive schemas file */
	generateNonCircularFile(defs) {
		const lines = [];
		lines.push('import { Schema } from "effect";');

		// Collect all external refs
		const circularImports = new Set();
		for (const [name, def] of defs) {
			this.collectRefs(def, (refName) => {
				if (this.groupFor.has(refName)) circularImports.add(refName);
			});
		}
		// Import classes from circular groups
		const circularByGroup = new Map();
		for (const refName of circularImports) {
			const gn = this.groupFor.get(refName);
			if (!circularByGroup.has(gn)) circularByGroup.set(gn, []);
			circularByGroup.get(gn).push(refName);
		}
		for (const [gn, names] of circularByGroup) {
			lines.push(`import { ${names.join(", ")} } from "./circular/${gn}.js";`);
		}
		lines.push("");

		for (const [name, def] of defs) {
			const code = this.expr(def, name, false, "");
			lines.push(`export const ${name}Schema = ${code}`);
		}
		lines.push("");
		return lines.join("\n");
	}

	/** Generate a circular group file — Schema.Opaque classes */
	generateCircularFile(group, groupName) {
		const lines = [];
		lines.push('import { Schema } from "effect";');

		// Import non-recursive schemas and cross-circular refs
		const deps = new Set();
		for (const name of group) {
			this.collectExternalDeps(this.definitions[name], name, deps);
		}
		for (const dep of deps) {
			if (this.groupFor.has(dep)) {
				const depGroup = this.groupFor.get(dep);
				if (depGroup !== groupName) {
					lines.push(`import { ${dep} } from "./${depGroup}.js";`);
				}
			} else {
				lines.push(`import { ${dep}Schema } from "../non-recursive.js";`);
			}
		}
		lines.push("");

		// Emit as Schema.Opaque classes — forward declarations work via class hoisting
		for (const name of group) {
			const def = this.definitions[name];
			if (!def) continue;
			const body = this.opaqueBody(def, name, groupName);
			lines.push(`export class ${name} extends Schema.Opaque<${name}>()(${body}) {}`);
			lines.push("");
		}

		return lines.join("\n");
	}

	/** Generate the body for a Schema.Opaque class */
	opaqueBody(def, name, groupName) {
		if (def.oneOf || def.anyOf) {
			// Union type: Schema.Struct({ schema: Schema.TaggedUnion({...}) })
			const variants = def.oneOf || def.anyOf;
			const isTagged = variants.every(
				(v) => v.type === "object" && v.properties?.type?.type === "string" && v.properties?.type?.enum?.length === 1,
			);

			if (isTagged) {
				const taggedVariants = [];
				for (const variant of variants) {
					const tag = variant.properties.type.enum[0];
					const otherProps = { ...variant.properties };
					delete otherProps.type;
					const required = (variant.required || []).filter((r) => r !== "type");
					const fields = [];
					for (const [key, propDef] of Object.entries(otherProps)) {
						const fs = this.fieldExpr(propDef, name, groupName);
						const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
						if (required.includes(key)) fields.push(`${qKey}: ${fs}`);
						else fields.push(`${qKey}: Schema.optionalKey(${fs})`);
					}
					const fieldStr =
						fields.length > 0 ? `{ ${fields.join(", ")} }` : `{ value: Schema.Literal(${JSON.stringify(tag)}) }`;
					taggedVariants.push(`${JSON.stringify(tag)}: ${fieldStr}`);
				}
				return `Schema.Struct({ schema: Schema.TaggedUnion({ ${taggedVariants.join(", ")} }) })`;
			}

			// Non-tagged union
			const schemas = variants.map((v) => this.fieldExpr(v, name, groupName));
			return `Schema.Struct({ schema: Schema.Union([${schemas.join(", ")}]) })`;
		}

		// Plain struct
		return this.structExpr(def, name, false, groupName);
	}

	/** Collect all fields from a definition — variant names become field keys */
	collectAllFields(def, contextName, groupName) {
		const fields = [];

		if (def.oneOf || def.anyOf) {
			// Union type: each variant name becomes a field key
			const variants = def.oneOf || def.anyOf;
			for (const variant of variants) {
				if (variant.type === "object" && variant.properties?.type?.enum?.length === 1) {
					const variantName = variant.properties.type.enum[0];
					const otherProps = { ...variant.properties };
					delete otherProps.type;
					const required = (variant.required || []).filter((r) => r !== "type");

					// Get the field value — unwrap { value: Schema } → Schema
					let fieldSchema;
					const propKeys = Object.keys(otherProps);
					if (propKeys.length === 1 && propKeys[0] === "value" && required.includes("value")) {
						// Single "value" property: unwrap it
						fieldSchema = this.fieldExpr(otherProps.value, contextName, groupName);
					} else if (propKeys.length === 0) {
						// Empty variant (e.g., "normal": {})
						fieldSchema = "";
					} else {
						// Multiple properties: use Struct
						const structFields = [];
						for (const [key, propDef] of Object.entries(otherProps)) {
							const fs = this.fieldExpr(propDef, contextName, groupName);
							const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
							if (required.includes(key)) structFields.push(`${qKey}: ${fs}`);
							else structFields.push(`${qKey}: Schema.optionalKey(${fs})`);
						}
						fieldSchema = `Schema.Struct({ ${structFields.join(", ")} })`;
					}

					const qVariant = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(variantName) ? variantName : JSON.stringify(variantName);
					if (fieldSchema) {
						fields.push(`${qVariant}: ${fieldSchema}`);
					}
				}
			}
		} else if (def.type === "object" && def.properties) {
			// Plain struct
			const required = new Set(def.required || []);
			for (const [key, propDef] of Object.entries(def.properties)) {
				const fieldSchema = this.fieldExpr(propDef, contextName, groupName);
				const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
				if (required.has(key)) fields.push(`${qKey}: ${fieldSchema}`);
				else fields.push(`${qKey}: Schema.optionalKey(${fieldSchema})`);
			}
		}

		return fields;
	}

	/** Generate a field expression (for use inside TaggedStruct) */
	fieldExpr(def, contextName, groupName) {
		if (!def) return "Schema.Unknown";
		if (def.$ref) {
			const refName = def.$ref.replace("#/definitions/", "");
			if (BUILTIN.has(refName)) return `Schema.${refName}`;
			if (refName === contextName) return `Schema.suspend((): Schema.Codec<${refName}> => ${refName})`;
			if (this.groupFor.get(refName) === groupName) return `Schema.suspend((): Schema.Codec<${refName}> => ${refName})`;
			if (this.groupFor.has(refName)) return `Schema.suspend((): Schema.Codec<${refName}> => ${refName})`;
			return `${refName}Schema`;
		}
		if (def.type === "string" && def.enum) {
			return def.enum.length === 1
				? `Schema.Literal(${JSON.stringify(def.enum[0])})`
				: `Schema.Literals([${def.enum.map((e) => JSON.stringify(e)).join(", ")}])`;
		}
		if (def.type === "string") return "Schema.String";
		if (def.type === "number" || def.type === "integer") return "Schema.Number";
		if (def.type === "boolean") return "Schema.Boolean";
		if (def.type === "null") return "Schema.Null";
		if (def.type === "array") {
			if (def.items) {
				// Check if items are union variants (for calc sums, etc.)
				if (def.items.$ref) {
					const refName = def.items.$ref.replace("#/definitions/", "");
					if (refName === contextName || this.groupFor.get(refName) === groupName) {
						return `Schema.Tuple([Schema.suspend((): Schema.Codec<${refName}> => ${refName}), Schema.suspend((): Schema.Codec<${refName}> => ${refName})])`;
					}
				}
				return `Schema.Array(${this.fieldExpr(def.items, contextName, groupName)})`;
			}
			return "Schema.Array(Schema.Unknown)";
		}
		if (def.type === "object" && def.properties) {
			return this.structExpr(def, contextName, false, groupName);
		}
		if (def.oneOf) {
			return `Schema.Union([${def.oneOf.map((v) => this.fieldExpr(v, contextName, groupName)).join(", ")}])`;
		}
		if (def.anyOf) {
			return `Schema.Union([${def.anyOf.map((v) => this.fieldExpr(v, contextName, groupName)).join(", ")}])`;
		}
		if (Array.isArray(def.type)) {
			if (def.type.includes("null") && def.type.length === 2) {
				const nonNull = def.type.find((t) => t !== "null");
				return `Schema.NullOr(${this.fieldExpr({ ...def, type: nonNull }, contextName, groupName)})`;
			}
			return "Schema.Unknown";
		}
		if (def.type === "object") return "Schema.Unknown";
		return "Schema.Unknown";
	}

	/** Generate a schema expression */
	expr(def, contextName, inCircular, groupName) {
		if (!def) return "Schema.Unknown";
		if (def.$ref) {
			const refName = def.$ref.replace("#/definitions/", "");
			if (BUILTIN.has(refName)) return `Schema.${refName}`;
			if (inCircular) {
				if (refName === contextName || this.groupFor.get(refName) === groupName) {
					return `Schema.suspend((): Schema.Codec<${refName}> => ${refName})`;
				}
				return `${refName}Schema`;
			}
			if (this.groupFor.has(refName)) {
				return `Schema.suspend((): Schema.Codec<${refName}> => ${refName})`;
			}
			return `${refName}Schema`;
		}
		if (def.type === "string" && def.enum) {
			return def.enum.length === 1
				? `Schema.Literal(${JSON.stringify(def.enum[0])})`
				: `Schema.Literals([${def.enum.map((e) => JSON.stringify(e)).join(", ")}])`;
		}
		if (def.type === "string") return "Schema.String";
		if (def.type === "number" || def.type === "integer") return "Schema.Number";
		if (def.type === "boolean") return "Schema.Boolean";
		if (def.type === "null") return "Schema.Null";
		if (def.type === "array") {
			if (def.items) return `Schema.Array(${this.expr(def.items, contextName, inCircular, groupName)})`;
			return "Schema.Array(Schema.Unknown)";
		}
		if (def.type === "object" && def.properties) {
			return this.structExpr(def, contextName, inCircular, groupName);
		}
		if (def.oneOf) return this.opaqueUnion(def.oneOf, contextName, inCircular, groupName);
		if (def.anyOf) return this.opaqueUnion(def.anyOf, contextName, inCircular, groupName);
		if (Array.isArray(def.type)) {
			if (def.type.includes("null") && def.type.length === 2) {
				const nonNull = def.type.find((t) => t !== "null");
				return `Schema.NullOr(${this.expr({ ...def, type: nonNull }, contextName, inCircular, groupName)})`;
			}
			return "Schema.Unknown";
		}
		if (def.type === "object") return "Schema.Unknown";
		return "Schema.Unknown";
	}

	/** Generate a Struct expression for a plain object (not a union variant) */
	structExpr(def, contextName, inCircular, groupName) {
		const required = new Set(def.required || []);
		const fields = [];
		for (const [key, propDef] of Object.entries(def.properties || {})) {
			const fieldSchema = this.expr(propDef, contextName, inCircular, groupName);
			const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
			if (required.has(key)) fields.push(`${qKey}: ${fieldSchema}`);
			else fields.push(`${qKey}: Schema.optionalKey(${fieldSchema})`);
		}
		if (fields.length === 0) return "Schema.Struct({})";
		return `Schema.Struct({ ${fields.join(", ")} })`;
	}

	/** Generate a union — wrap variants in TaggedStruct classes for Opaque compatibility */
	opaqueUnion(members, contextName, inCircular, groupName) {
		const isTagged = members.every(
			(m) => m.type === "object" && m.properties?.type?.type === "string" && m.properties?.type?.enum?.length === 1,
		);

		if (isTagged && inCircular) {
			// In Opaque context: each variant is a Schema.TaggedStruct
			const variants = members.map((m) => {
				const tag = m.properties.type.enum[0];
				const otherProps = { ...m.properties };
				delete otherProps.type;
				const required = (m.required || []).filter((r) => r !== "type");
				const fields = [];
				for (const [key, propDef] of Object.entries(otherProps)) {
					const fieldSchema = this.expr(propDef, contextName, inCircular, groupName);
					const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
					if (required.includes(key)) fields.push(`${qKey}: ${fieldSchema}`);
					else fields.push(`${qKey}: Schema.optionalKey(${fieldSchema})`);
				}
				return `Schema.TaggedStruct(${JSON.stringify(tag)}, { ${fields.join(", ")} })`;
			});
			return `Schema.Union([${variants.join(", ")}])`;
		}

		// Non-circular context or non-tagged: use Schema.TaggedUnion
		if (isTagged) {
			const variants = [];
			for (const m of members) {
				const tag = m.properties.type.enum[0];
				const otherProps = { ...m.properties };
				delete otherProps.type;
				const required = (m.required || []).filter((r) => r !== "type");
				const fields = [];
				for (const [key, propDef] of Object.entries(otherProps)) {
					const fieldSchema = this.expr(propDef, contextName, inCircular, groupName);
					const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
					if (required.includes(key)) fields.push(`${qKey}: ${fieldSchema}`);
					else fields.push(`${qKey}: Schema.optionalKey(${fieldSchema})`);
				}
				variants.push(`${JSON.stringify(tag)}: { ${fields.join(", ")} }`);
			}
			return `Schema.TaggedUnion({ ${variants.join(", ")} })`;
		}

		const schemas = members.map((m) => this.expr(m, contextName, inCircular, groupName));
		return `Schema.Union([${schemas.join(", ")}])`;
	}

	struct(def, contextName, inCircular, groupName) {
		const required = new Set(def.required || []);
		const fields = [];
		for (const [key, propDef] of Object.entries(def.properties || {})) {
			const fieldSchema = this.expr(propDef, contextName, inCircular, groupName);
			const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
			if (required.has(key)) fields.push(`${qKey}: ${fieldSchema}`);
			else fields.push(`${qKey}: Schema.optionalKey(${fieldSchema})`);
		}
		if (fields.length === 0) return "Schema.Struct({})";
		return `Schema.Struct({ ${fields.join(", ")} })`;
	}

	union(members, contextName, inCircular, groupName) {
		const isTagged = members.every(
			(m) => m.type === "object" && m.properties?.type?.type === "string" && m.properties?.type?.enum?.length === 1,
		);
		if (isTagged) {
			const variants = [];
			for (const m of members) {
				const tag = m.properties.type.enum[0];
				const otherProps = { ...m.properties };
				delete otherProps.type;
				const required = (m.required || []).filter((r) => r !== "type");
				const fields = [];
				for (const [key, propDef] of Object.entries(otherProps)) {
					const fieldSchema = this.expr(propDef, contextName, inCircular, groupName);
					const qKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
					if (required.includes(key)) fields.push(`${qKey}: ${fieldSchema}`);
					else fields.push(`${qKey}: Schema.optionalKey(${fieldSchema})`);
				}
				variants.push(`${JSON.stringify(tag)}: { ${fields.join(", ")} }`);
			}
			return `Schema.TaggedUnion({ ${variants.join(", ")} })`;
		}
		const schemas = members.map((m) => this.expr(m, contextName, inCircular, groupName));
		return `Schema.Union([${schemas.join(", ")}])`;
	}

	collectExternalDeps(def, selfName, result) {
		if (!def) return;
		if (def.$ref) {
			const refName = def.$ref.replace("#/definitions/", "");
			if (!BUILTIN.has(refName) && refName !== selfName) result.add(refName);
		}
		if (def.properties) for (const p of Object.values(def.properties)) this.collectExternalDeps(p, selfName, result);
		if (def.items) this.collectExternalDeps(def.items, selfName, result);
		if (def.oneOf) for (const m of def.oneOf) this.collectExternalDeps(m, selfName, result);
		if (def.anyOf) for (const m of def.anyOf) this.collectExternalDeps(m, selfName, result);
	}

	collectRefs(def, fn) {
		if (!def) return;
		if (def.$ref) fn(def.$ref.replace("#/definitions/", ""));
		if (def.properties) for (const p of Object.values(def.properties)) this.collectRefs(p, fn);
		if (def.items) this.collectRefs(def.items, fn);
		if (def.oneOf) for (const m of def.oneOf) this.collectRefs(m, fn);
		if (def.anyOf) for (const m of def.anyOf) this.collectRefs(m, fn);
	}

	topologicalSort() {
		const visited = new Set();
		const result = [];
		const visiting = new Set();
		const visit = (name) => {
			if (visited.has(name) || visiting.has(name)) return;
			visiting.add(name);
			const def = this.definitions[name];
			if (def) for (const dep of this.deps(def)) if (!this.inCircular.has(dep)) visit(dep);
			visiting.delete(name);
			visited.add(name);
			if (def) result.push([name, def]);
		};
		for (const name of Object.keys(this.definitions)) if (!this.inCircular.has(name)) visit(name);
		return result;
	}

	/** Find ALL circular dependency groups using DFS back-edge detection */
	findCircularGroups() {
		const allDefs = new Set(Object.keys(this.definitions));
		const adj = new Map();
		for (const name of allDefs) {
			adj.set(
				name,
				[...this.deps(this.definitions[name])].filter((d) => allDefs.has(d)),
			);
		}

		// Tarjan's SCC algorithm to find strongly connected components
		let index = 0;
		const indices = new Map();
		const lowlinks = new Map();
		const onStack = new Set();
		const stack = [];
		const sccs = [];

		const strongconnect = (v) => {
			indices.set(v, index);
			lowlinks.set(v, index);
			index++;
			stack.push(v);
			onStack.add(v);

			for (const w of adj.get(v) || []) {
				if (!indices.has(w)) {
					strongconnect(w);
					lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
				} else if (onStack.has(w)) {
					lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
				}
			}

			if (lowlinks.get(v) === indices.get(v)) {
				const scc = [];
				let w;
				do {
					w = stack.pop();
					onStack.delete(w);
					scc.push(w);
				} while (w !== v);
				if (scc.length > 1) sccs.push(scc.sort());
				else if (scc.length === 1) {
					// Check if it's actually self-recursive
					const node = scc[0];
					if (adj.get(node)?.includes(node)) sccs.push(scc);
				}
			}
		};

		for (const v of allDefs) {
			if (!indices.has(v)) strongconnect(v);
		}

		return sccs;
	}

	deps(def, result = new Set()) {
		if (!def) return result;
		if (def.$ref) result.add(def.$ref.replace("#/definitions/", ""));
		if (def.properties) for (const p of Object.values(def.properties)) this.deps(p, result);
		if (def.items) this.deps(def.items, result);
		if (def.oneOf) for (const m of def.oneOf) this.deps(m, result);
		if (def.anyOf) for (const m of def.anyOf) this.deps(m, result);
		return result;
	}
}

// Main
function main() {
	if (process.argv.includes("--regen-ast") || !existsSync(astJsonPath)) {
		console.log("Generating ast.json...");
		const lcsDir = "/tmp/lightningcss-schema";
		execSync("cargo run --example schema --features jsonschema", { cwd: lcsDir, stdio: "pipe" });
		writeFileSync(astJsonPath, readFileSync(join(lcsDir, "node", "ast.json")));
	}

	console.log("Reading ast.json...");
	const raw = JSON.parse(readFileSync(astJsonPath, "utf-8"));

	const codegen = new SchemaCodegen(raw);
	const result = codegen.generate();

	console.log(`Generated ${result.files} schema files (${result.totalSchemas} definitions)`);
	console.log(`  ${codegen.circularGroups.length} circular groups → circular/*.ts`);
	console.log(`  Output: src/generated/schemas/`);
}

main();
