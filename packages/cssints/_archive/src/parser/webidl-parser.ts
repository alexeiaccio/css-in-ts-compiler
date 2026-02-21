export interface WebIDLDefinition {
  type: "interface" | "namespace" | "dictionary" | "enum" | "typedef"
  name: string
  members?: WebIDLInterfaceMember[]
  properties?: WebIDLProperty[]
  methods?: WebIDLOperation[]
  values?: string[]
}

export interface WebIDLInterfaceMember {
  type: "attribute" | "operation" | "constructor" | "stringifier"
  name: string
  returnType?: string
  arguments?: WebIDLArgument[]
  isStatic?: boolean
  isReadonly?: boolean
}

export interface WebIDLProperty {
  name: string
  type: string
  isReadonly?: boolean
}

export interface WebIDLOperation {
  name: string
  returnType: string
  arguments: WebIDLArgument[]
  isStatic: boolean
}

export interface WebIDLArgument {
  name: string
  type: string
  isOptional?: boolean
  defaultValue?: string
}

export interface WebIDLEnum {
  name: string
  values: string[]
}

export interface WebIDLTypedef {
  name: string
  type: string
}

import webidlGrammar from "../grammars/webidl.ohm-bundle.js"

export function parseWebIDL(input: string): WebIDLDefinition[] {
  console.log("Attempting to parse...")
  console.log("Input length:", input.length)
  const match = webidlGrammar.match(input)
  if (match.failed()) {
    if (match.interval) {
      console.log("Match failed at position:", match.interval.startIdx)
      console.log("Input around error:", input.substring(match.interval.startIdx, match.interval.endIdx + 20))
    }
    throw new Error(`WebIDL parsing failed: ${match.message}`)
  }

  const semantics = webidlGrammar.createSemantics()
  semantics.addOperation("toDefinitions", {
    Definitions(definitions) {
      return definitions.children.map((d) => d.toDefinition())
    },
  })

  semantics.addOperation("toSingleDefinition", {
    InlineDefinition(extAttrs, definition) {
      console.log("InlineDefinition matched!")
      return definition.toDefinition()
    },
  })

  semantics.addOperation("toDefinition", {
    Interface(extAttrs, _interface, name, _colon, _open, members, _close, _semi) {
      return {
        type: "interface",
        name: name.sourceString,
        members: members.toInterfaceMembers(),
      }
    },

    Namespace(extAttrs, _namespace, name, _open, members, _close, _semi) {
      return {
        type: "namespace",
        name: name.sourceString,
        members: members.toInterfaceMembers(),
      }
    },

    Dictionary(extAttrs, _dictionary, name, _colon, _open, members, _close, _semi) {
      return {
        type: "dictionary",
        name: name.sourceString,
        properties: members.toDictionaryProperties(),
      }
    },

    Enum(extAttrs, _enum, name, _open, values, _close, _semi) {
      return {
        type: "enum",
        name: name.sourceString,
        values: values.toEnumValues(),
      }
    },

    Typedef(extAttrs, _typedef, type, name, _semi) {
      return {
        type: "typedef",
        name: name.sourceString,
        type: type.toType(),
      }
    },
  })

  semantics.addOperation("toInterfaceMembers", {
    InterfaceMember(members) {
      return members.children.map((m) => m.toInterfaceMember())
    },
  })

  semantics.addOperation("toInterfaceMember", {
    Attribute(extAttrs, _readonly, _attribute, type, name, _semi) {
      return {
        type: "attribute",
        name: name.sourceString,
        returnType: type.toType(),
        isReadonly: !!_readonly.children[0],
      }
    },

    Operation(extAttrs, _static, returnType, name, _open, args, _close, _semi) {
      return {
        type: "operation",
        name: name.sourceString,
        returnType: returnType.toType(),
        arguments: args.toArguments(),
        isStatic: !!_static.children[0],
        isReadonly: false,
      }
    },

    Constructor(extAttrs, _open, args, _close, _semi) {
      return {
        type: "constructor",
        name: "constructor",
        returnType: "void",
        arguments: args.toArguments(),
        isStatic: true,
        isReadonly: false,
      }
    },

    Stringifier(_semi) {
      return {
        type: "stringifier",
        name: "stringifier",
        returnType: "void",
        arguments: [],
        isStatic: false,
        isReadonly: false,
      }
    },
  })

  semantics.addOperation("toDictionaryProperties", {
    DictionaryMember(members) {
      return members.children.map((m) => m.toDictionaryMember())
    },
  })

  semantics.addOperation("toDictionaryMember", {
    DictionaryMemberProperty(extAttrs, name, type, _semi) {
      return {
        name: name.sourceString,
        type: type.toType(),
        isReadonly: false,
      }
    },
  })

  semantics.addOperation("toEnumValues", {
    EnumValue(members) {
      return members.children.map((m) => m.toEnumValue())
    },
  })

  semantics.addOperation("toEnumValue", {
    EnumValue(value) {
      return value.toValue()
    },
  })

  semantics.addOperation("toValue", {
    QuotedString(value) {
      return value.sourceString.slice(1, -1)
    },

    String(value) {
      return value.sourceString
    },
  })

  semantics.addOperation("toArguments", {
    Arguments(args) {
      return args.children.map((a) => a.toArgument())
    },

    EmptyArguments() {
      return []
    },

    CommaArgument(first, rest) {
      return [first.toArgument(), ...rest.Arguments()]
    },
  })

  semantics.addOperation("toArgument", {
    Argument(extAttrs, _optional, type, name, _equals, defaultValue) {
      return {
        name: name.sourceString,
        type: type.toType(),
        isOptional: !!_optional.children[0],
        defaultValue: defaultValue?.toDefaultValue(),
      }
    },
  })

  semantics.addOperation("toDefaultValue", {
    DefaultValue(value) {
      return value.toValueString()
    },
  })

  semantics.addOperation("toValueString", {
    QuotedString(value) {
      return value.sourceString.slice(1, -1)
    },

    String(value) {
      return value.sourceString
    },
  })

  semantics.addOperation("toType", {
    SingleType(type) {
      return type.toSingleType()
    },

    UnionType(_open, first, _or, rest, _close) {
      return rest.toUnionTypes()
    },

    SequenceType(_sequence, _less, type, _greater) {
      return `sequence<${type.toType()}>`
    },

    FrozenArrayType(_frozen, _open, type, _close) {
      return `FrozenArray<${type.toType()}>`
    },
  })

  semantics.addOperation("toSingleType", {
    PrimitiveType(type) {
      return type.toPrimitiveType()
    },

    Identifier(type) {
      return type.sourceString
    },
  })

  semantics.addOperation("toPrimitiveType", {
    PrimitiveType(type) {
      return type.sourceString
    },
  })

  semantics.addOperation("toUnionTypes", {
    UnionType(first, _or, rest) {
      const types = [first.toType(), ...rest.toUnionTypes()]
      return `(${types.join(" | ")})`
    },

    Empty() {
      return ""
    },
  })

  const ast = semantics(match).toDefinitions()
  return ast
}


