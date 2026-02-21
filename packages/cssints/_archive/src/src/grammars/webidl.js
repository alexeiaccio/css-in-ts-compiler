import { Grammar as _Grammar } from "ohm-js";

const grammar = _Grammar.fromSource(`
WebIDL {
  // Main structure
  Definitions = Definition*

  // Interface definition
  Interface = ExtendedAttributeList? "interface" identifier Inheritance? "{" InterfaceMembers "}" ";"
  InterfaceMembers = InterfaceMember*

  // Interface members
  InterfaceMember = Attribute | Operation | Constructor | Stringifier

  // Attribute
  Attribute = ExtendedAttributeList? "readonly"? "attribute" Type identifier ";"

  // Operation (method)
  Operation = ExtendedAttributeList? "static"? Type identifier "(" ArgumentList? ")" ";"

  // Constructor
  Constructor = ExtendedAttributeList? "constructor" "(" ArgumentList? ")" ";"

  // Type system
  Type = SingleType | UnionType | SequenceType | FrozenArrayType

  // Single types
  SingleType = PrimitiveType | identifier

  // Primitive types
  PrimitiveType = "unsigned"? ("long" "long"? | "short")
               | "unrestricted"? ("double" | "float")
               | "boolean" | "byte" | "octet"
               | "DOMString" | "USVString" | "void"
               | "numberish"

  // Union types
  UnionType = "(" Type "or" Type ("or" Type)* ")"

  // Sequence type
  SequenceType = "sequence" "<" Type ">"

  // Frozen array type
  FrozenArrayType = "FrozenArray" "<" Type ">"

  // Common elements
  identifier = letter (letter | digit | "_")*

  Inheritance = ":" identifier

  ArgumentList = Argument ("," Argument)*

  Argument = ExtendedAttributeList? "optional"? Type identifier ("=" DefaultValue)?

  DefaultValue = number | string | identifier

  // Extended attributes
  ExtendedAttributeList = "[" ExtendedAttribute ("," ExtendedAttribute)* "]"
  ExtendedAttribute = identifier ("(" ExtendedAttributeInner ")")?
  ExtendedAttributeInner = identifier | number | string

  // Other definitions
  Partial = "partial" (Interface | Namespace | Dictionary)
  Namespace = ExtendedAttributeList? "namespace" identifier "{" NamespaceMembers "}" ";"
  Dictionary = ExtendedAttributeList? "dictionary" identifier Inheritance? "{" DictionaryMembers "}" ";"
  DictionaryMembers = DictionaryMember*

  DictionaryMember = ExtendedAttributeList? identifier Type ";"

  Enum = ExtendedAttributeList? "enum" identifier "{" EnumValues "}" ";"

  EnumValues = NonemptyListOf<string, ",">

  Typedef = ExtendedAttributeList? "typedef" Type identifier ";"

  Stringifier = "stringifier" ";"
}

`);

export const webidlGrammar = grammar;
