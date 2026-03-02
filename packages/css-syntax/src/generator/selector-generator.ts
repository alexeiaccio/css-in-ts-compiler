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
} from "../parser/selector-ast.js";

export function generateSelector(node: ComplexSelector): string {
  return node.children.map(generateSelectorNode).join("");
}

function generateSelectorNode(node: SelectorNode): string {
  switch (node.type) {
    case "complex":
      return generateSelector(node);
    case "compound":
      return generateCompoundSelector(node);
    case "type":
      return generateTypeSelector(node);
    case "class":
      return generateClassSelector(node);
    case "id":
      return generateIdSelector(node);
    case "attribute":
      return generateAttributeSelector(node);
    case "pseudo-class":
      return generatePseudoClassSelector(node);
    case "pseudo-element":
      return generatePseudoElementSelector(node);
    case "combinator":
      return generateCombinator(node);
    default:
      return "";
  }
}

function generateCompoundSelector(node: CompoundSelector): string {
  return node.children.map(generateSelectorNode).join("");
}

function generateTypeSelector(node: TypeSelector): string {
  if (node.namespace) {
    return `${node.namespace}|${node.name}`;
  }
  return node.name;
}

function generateClassSelector(node: ClassSelector): string {
  return `.${node.name}`;
}

function generateIdSelector(node: IdSelector): string {
  return `#${node.name}`;
}

function generateAttributeSelector(node: AttributeSelector): string {
  let result = "[";

  if (node.namespace) {
    result += `${node.namespace}|`;
  }

  result += node.name;

  if (node.operator) {
    result += node.operator;
    if (node.value) {
      result += `"${node.value}"`;
    }
  }

  if (node.flags) {
    result += ` ${node.flags}`;
  }

  result += "]";
  return result;
}

function generatePseudoClassSelector(node: PseudoClassSelector): string {
  let result = `:${node.name}`;

  if (node.args && node.args.length > 0) {
    result += "(";
    result += node.args.map(generateSelectorNode).join("");
    result += ")";
  }

  return result;
}

function generatePseudoElementSelector(node: PseudoElementSelector): string {
  let result = `::${node.name}`;

  if (node.args && node.args.length > 0) {
    result += "(";
    result += node.args.map(generateSelectorNode).join("");
    result += ")";
  }

  return result;
}

function generateCombinator(node: Combinator): string {
  switch (node.kind) {
    case " ":
      return " ";
    case ">":
      return " > ";
    case "+":
      return " + ";
    case "~":
      return " ~ ";
    case "||":
      return " || ";
    default:
      return " ";
  }
}
