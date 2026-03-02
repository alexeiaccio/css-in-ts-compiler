import type {
  CSSValueNode,
  KeywordNode,
  IdentNode,
  NumberNode,
  DimensionNode,
  PercentageNode,
  StringNode,
  UrlNode,
  FunctionNode,
  CompositeNode,
} from "../parser/css-value-parser.js";

export function generateCSSValue(node: CSSValueNode): string {
  switch (node.type) {
    case "keyword":
      return generateKeyword(node);
    case "ident":
      return generateIdent(node);
    case "number":
      return generateNumber(node);
    case "dimension":
      return generateDimension(node);
    case "percentage":
      return generatePercentage(node);
    case "string":
      return generateString(node);
    case "url":
      return generateUrl(node);
    case "function":
      return generateFunction(node);
    case "composite":
      return generateComposite(node);
    default:
      return "";
  }
}

function generateKeyword(node: KeywordNode): string {
  return node.value;
}

function generateIdent(node: IdentNode): string {
  return node.value;
}

function generateNumber(node: NumberNode): string {
  return node.value;
}

function generateDimension(node: DimensionNode): string {
  return `${node.value}${node.unit}`;
}

function generatePercentage(node: PercentageNode): string {
  return `${node.value}%`;
}

function generateString(node: StringNode): string {
  return `"${node.value}"`;
}

function generateUrl(node: UrlNode): string {
  return `url(${node.value})`;
}

function generateFunction(node: FunctionNode): string {
  const args = node.args.map(generateCSSValue).join(" ");
  return `${node.name}(${args})`;
}

function generateComposite(node: CompositeNode): string {
  const combinator = getCombinatorString(node.combinator);
  return node.nodes.map(generateCSSValue).join(combinator);
}

function getCombinatorString(combinator: CompositeNode["combinator"]): string {
  switch (combinator) {
    case " ":
      return " ";
    case "|":
      return " | ";
    case "||":
      return " || ";
    case "&&":
      return " && ";
    default:
      return " ";
  }
}
