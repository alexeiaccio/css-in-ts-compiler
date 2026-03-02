import type {
  SyntaxNode,
  SyntaxTree,
  TypeReference,
  Keyword,
  PropertyReference,
  Range,
  FunctionNode,
  Group,
  MultipliedNode,
  CombinedNode,
} from "../parser/ast.js";

export function generateValueDefinition(tree: SyntaxTree): string {
  return generateSyntaxNode(tree.root);
}

function generateSyntaxNode(node: SyntaxNode): string {
  switch (node.type) {
    case "type-reference":
      return generateTypeReference(node);
    case "keyword":
      return generateKeyword(node);
    case "property-reference":
      return generatePropertyReference(node);
    case "range":
      return generateRange(node);
    case "function":
      return generateFunction(node);
    case "group":
      return generateGroup(node);
    case "multiplied":
      return generateMultipliedNode(node);
    case "combined":
      return generateCombinedNode(node);
    default:
      return "";
  }
}

function generateTypeReference(node: TypeReference): string {
  return `<${node.name}>`;
}

function generateKeyword(node: Keyword): string {
  return node.value;
}

function generatePropertyReference(node: PropertyReference): string;
function generatePropertyReference(node: PropertyReference): string {
  return `<'${node.property}'>`;
}

function generateRange(node: Range): string {
  return `[${node.base} ${node.min} ${node.max}]`;
}

function generateFunction(node: FunctionNode): string {
  const args = node.args.map(generateSyntaxNode).join(", ");
  return `${node.name}(${args})`;
}

function generateGroup(node: Group): string {
  let result = "(";

  result += node.nodes.map(generateSyntaxNode).join("");

  if (node.combinator) {
    const comb = getCombinatorString(node.combinator);
    result = result.replace(/([^)])($)/, `$1${comb}$2`);
  }

  result += ")";

  if (node.required) {
    result += "!";
  }

  if (node.multiplier) {
    result += generateMultiplier(node.multiplier);
  }

  return result;
}

function generateMultipliedNode(node: MultipliedNode): string {
  let result = generateSyntaxNode(node.node);
  result += generateMultiplier(node.multiplier);
  return result;
}

function generateCombinedNode(node: CombinedNode): string {
  const left = generateSyntaxNode(node.left);
  const right = generateSyntaxNode(node.right);
  const comb = getCombinatorString(node.combinator);
  return `${left} ${comb} ${right}`;
}

function generateMultiplier(multiplier: { type: string; min?: number; max?: number | "infinity" }): string {
  switch (multiplier.type) {
    case "*":
      return "*";
    case "+":
      return "+";
    case "?":
      return "?";
    case "#":
      return "#";
    case "{n}":
      return `{${multiplier.min}}`;
    case "{n,m}":
      return `{${multiplier.min},${multiplier.max}}`;
    case "{n,}":
      return `{${multiplier.min},}`;
    default:
      return "";
  }
}

function getCombinatorString(combinator: string): string {
  switch (combinator) {
    case "bar":
      return "|";
    case "double-bar":
      return "||";
    case "double-ampersand":
      return "&&";
    case "juxtapose":
      return "";
    default:
      return "";
  }
}
