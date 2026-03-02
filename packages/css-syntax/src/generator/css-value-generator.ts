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
  ColorFunctionNode,
  ColorMixNode,
  LightDarkNode,
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
    case "color-function":
      return generateColorFunction(node);
    case "color-mix":
      return generateColorMix(node);
    case "light-dark":
      return generateLightDark(node);
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

function generateColorFunction(node: ColorFunctionNode): string {
  const components = node.components
    .map((c) => typeof c.value === "number" ? String(c.value) : c.value)
    .join(" ");
  const alpha = node.alpha !== undefined ? ` / ${node.alpha * 100}%` : "";
  return `${node.name}(${components}${alpha})`;
}

function generateColorMix(node: ColorMixNode): string {
  const c1 = generateCSSValue(node.color1);
  const c2 = generateCSSValue(node.color2);
  const weight = node.weight1 !== undefined ? ` / ${node.weight1}%` : "";
  return `color-mix(${node.mode}, ${c1}, ${c2}${weight})`;
}

function generateLightDark(node: LightDarkNode): string {
  const light = generateCSSValue(node.light);
  const dark = generateCSSValue(node.dark);
  return `light-dark(${light}, ${dark})`;
}
