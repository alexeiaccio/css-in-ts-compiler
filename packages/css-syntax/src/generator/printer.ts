import type { CSSValueNode } from "../parser/css-value-parser.js";
import type { SelectorNode } from "../parser/selector-ast-effect.js";
import type {
	CSSStyleSheet,
	CSSRule,
	CSSDeclaration,
	CSSBlock,
	CSSComment,
	CSSInvalidDeclaration,
} from "../parser/stylesheet-ast-effect.js";

import { generateCSSValue } from "./css-value-generator.js";
import { generateSelector } from "./selector-generator.js";

type AnyCSSNode =
	| SelectorNode
	| CSSValueNode
	| CSSStyleSheet
	| CSSRule
	| CSSDeclaration
	| CSSBlock
	| CSSComment
	| CSSInvalidDeclaration;

export function print(node: AnyCSSNode): string {
	const n = node as any;

	switch (n.type) {
		case "complex":
			return generateSelector(n);
		case "compound":
		case "type":
		case "class":
		case "id":
		case "attribute":
		case "pseudo-class":
		case "pseudo-element":
		case "combinator":
			return printSelectorNode(n);
		case "keyword":
		case "ident":
		case "number":
		case "dimension":
		case "percentage":
		case "string":
		case "url":
		case "function":
		case "composite":
			return generateCSSValue(n);
		case "stylesheet":
			return printStyleSheet(n);
		case "style":
		case "at-rule":
		case "nested-style":
		case "layer":
		case "container":
		case "media":
		case "supports":
		case "keyframes":
		case "import":
		case "keyframe":
			return printRule(n);
		case "declaration":
			return printDeclaration(n);
		case "invalid-declaration":
			return n.raw;
		case "comment":
			return n.value;
		case "block":
			return printBlock(n);
		default:
			return "";
	}
}

function printSelectorNode(node: any): string {
	if (node.children) {
		return node.children.map((c: any) => print(c)).join("");
	}
	if (node.name) {
		return node.name;
	}
	if (node.value) {
		return node.value;
	}
	return "";
}

function printStyleSheet(sheet: CSSStyleSheet): string {
	return sheet.children.map((rule) => printRule(rule)).join("\n\n");
}

function printRule(rule: CSSRule): string {
	const r = rule as any;

	switch (r.type) {
		case "style":
			return printStyleRule(r);
		case "at-rule":
			return printAtRule(r);
		case "nested-style":
			return printNestedStyle(r);
		case "layer":
			return printLayer(r);
		case "container":
			return printContainer(r);
		case "media":
			return printMedia(r);
		case "supports":
			return printSupports(r);
		case "keyframes":
			return printKeyframes(r);
		case "import":
			return printImport(r);
		case "keyframe":
			return printKeyframeRule(r);
		default:
			return "";
	}
}

function printStyleRule(rule: any): string {
	let out = `${rule.selector} {\n`;
	for (const decl of rule.declarations) {
		out += `  ${printDeclaration(decl)};\n`;
	}
	if (rule.children) {
		for (const child of rule.children) {
			out += `  ${printRule(child)}\n`;
		}
	}
	out += "}";
	return out;
}

function printAtRule(rule: any): string {
	let out = `@${rule.name}`;
	if (rule.prelude) out += ` ${rule.prelude}`;
	if (rule.block) {
		out += " {\n";
		for (const child of rule.block.children) {
			out += `  ${print(child)};\n`;
		}
		out += "}";
	}
	return out;
}

function printNestedStyle(rule: any): string {
	return printStyleRule(rule);
}

function printLayer(rule: any): string {
	let out = rule.name ? `@layer ${rule.name} {\n` : "@layer {\n";
	for (const child of rule.children) {
		out += `  ${printRule(child)}\n`;
	}
	out += "}";
	return out;
}

function printContainer(rule: any): string {
	let out = `@container ${rule.prelude} {\n`;
	for (const child of rule.children) {
		out += `  ${printRule(child)}\n`;
	}
	out += "}";
	return out;
}

function printMedia(rule: any): string {
	let out = `@media ${rule.media} {\n`;
	for (const child of rule.children) {
		out += `  ${printRule(child)}\n`;
	}
	out += "}";
	return out;
}

function printSupports(rule: any): string {
	let out = `@supports ${rule.condition} {\n`;
	for (const child of rule.children) {
		out += `  ${printRule(child)}\n`;
	}
	out += "}";
	return out;
}

function printKeyframes(rule: any): string {
	let out = `@keyframes ${rule.name} {\n`;
	for (const child of rule.children) {
		out += `  ${printKeyframeRule(child)}\n`;
	}
	out += "}";
	return out;
}

function printKeyframeRule(rule: any): string {
	return `${rule.selectors.join(", ")} {\n${rule.declarations.map((d: any) => `  ${printDeclaration(d)};`).join("\n")}\n}`;
}

function printImport(rule: any): string {
	return `@import ${rule.url}${rule.media ? ` ${rule.media}` : ""};`;
}

function printDeclaration(decl: CSSDeclaration): string {
	return `${decl.property}: ${decl.value}`;
}

function printBlock(block: any): string {
	return `{ ${block.children.map((c: any) => print(c)).join(" ")} }`;
}
