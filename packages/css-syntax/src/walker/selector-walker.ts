import type {
	SelectorNode,
	ComplexSelector,
	CompoundSelector,
	TypeSelector,
	ClassSelector,
	IdSelector,
	AttributeSelector,
	PseudoClassSelector,
	PseudoElementSelector,
	Combinator,
	Specificity,
} from "../parser/selector-ast-effect.js";

export function walkSelector(node: SelectorNode, fn: (n: SelectorNode) => void): void {
	fn(node);

	if (node.type === "complex") {
		for (const child of node.children) {
			walkSelector(child, fn);
		}
	} else if (node.type === "compound") {
		for (const child of node.children) {
			walkSelector(child, fn);
		}
	}
}

export function collectSelectorNodes(node: SelectorNode): SelectorNode[] {
	const nodes: SelectorNode[] = [];

	walkSelector(node, (n) => {
		nodes.push(n);
	});

	return nodes;
}

export function calculateSpecificity(node: ComplexSelector): Specificity {
	return node.specificity;
}

export function specificityToNumber(s: Specificity): number {
	return s.a * 65536 + s.b * 256 + s.c;
}

export function compareSpecificity(a: Specificity, b: Specificity): number {
	if (a.a !== b.a) return b.a - a.a;
	if (a.b !== b.b) return b.b - a.b;
	return b.c - a.c;
}

export function mapSelector(node: ComplexSelector, fn: (n: SelectorNode) => SelectorNode): ComplexSelector {
	function mapNode(n: SelectorNode): SelectorNode {
		if (n.type === "complex") {
			return {
				type: "complex",
				children: n.children.map((child) => mapNode(child)) as Array<CompoundSelector | Combinator>,
				specificity: n.specificity,
			};
		}
		if (n.type === "compound") {
			return {
				type: "compound",
				children: n.children.map((child) => mapNode(child)) as any,
			};
		}
		return fn(n);
	}

	return mapNode(node) as ComplexSelector;
}

export function filterSelector(node: ComplexSelector, fn: (n: SelectorNode) => boolean): ComplexSelector | null {
	function filterNode(n: SelectorNode): SelectorNode | null {
		if (n.type === "complex") {
			const filtered = n.children
				.map((child) => filterNode(child))
				.filter((child): child is CompoundSelector | Combinator => child !== null);
			if (filtered.length === 0) return null;
			return {
				type: "complex",
				children: filtered,
				specificity: { a: 0, b: 0, c: 0 },
			};
		}
		if (n.type === "compound") {
			const filtered = n.children.filter(fn);
			if (filtered.length === 0) return null;
			return {
				type: "compound",
				children: filtered,
			};
		}
		return fn(n) ? n : null;
	}

	const result = filterNode(node);
	return result as ComplexSelector | null;
}

export function findSelectorNodes(node: ComplexSelector, fn: (n: SelectorNode) => boolean): SelectorNode[] {
	const results: SelectorNode[] = [];

	walkSelector(node, (n) => {
		if (fn(n)) {
			results.push(n);
		}
	});

	return results;
}

export function getTypeSelectors(node: ComplexSelector): TypeSelector[] {
	return findSelectorNodes(node, (n) => n.type === "type") as TypeSelector[];
}

export function getClassSelectors(node: ComplexSelector): ClassSelector[] {
	return findSelectorNodes(node, (n) => n.type === "class") as ClassSelector[];
}

export function getIdSelectors(node: ComplexSelector): IdSelector[] {
	return findSelectorNodes(node, (n) => n.type === "id") as IdSelector[];
}

export function getAttributeSelectors(node: ComplexSelector): AttributeSelector[] {
	return findSelectorNodes(node, (n) => n.type === "attribute") as AttributeSelector[];
}

export function getPseudoClasses(node: ComplexSelector): PseudoClassSelector[] {
	return findSelectorNodes(node, (n) => n.type === "pseudo-class") as PseudoClassSelector[];
}

export function getPseudoElements(node: ComplexSelector): PseudoElementSelector[] {
	return findSelectorNodes(node, (n) => n.type === "pseudo-element") as PseudoElementSelector[];
}

export function getCombinators(node: ComplexSelector): Combinator[] {
	return findSelectorNodes(node, (n) => n.type === "combinator") as Combinator[];
}
