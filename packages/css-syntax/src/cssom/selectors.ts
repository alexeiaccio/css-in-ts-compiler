/**
 * CSSOM selector classes
 * 
 * Full implementation of CSSOM selector types
 * @spec CSS Selectors §4 - Selectors
 * @spec CSSOM §5.2 - Serializing selectors
 */

/**
 * CSSOM ClassSelector
 * 
 * @spec CSS Selectors §4.1 - Class selectors
 * @spec CSSOM §5.2 - Serializing selectors
 * 
 * @see https://drafts.csswg.org/selectors/#class-selector
 */
export class ClassSelector {
  public readonly className: string;
  public readonly selectorText: string;

  /**
   * Create ClassSelector
   * 
   * @param className - CSS class name (without dot)
   * @returns ClassSelector instance
   * 
   * @see https://drafts.csswg.org/selectors/#class-selector
   */
  constructor(className: string) {
    this.className = className;
    this.selectorText = `.${className}`;
  }

  /**
   * Get selector text
   * 
   * @returns Serialized selector
   * 
   * @implements CSSOM §5.2 - Class selector serialization
   * @see https://drafts.csswg.org/cssom-1/#serializing-selectors
   */
  get selector(): string {
    return this.selectorText;
  }

  /**
   * Convert to string (CSSOM toString)
   * 
   * @returns CSS string representation
   */
  toString(): string {
    return this.selectorText;
  }
}

/**
 * CSSOM IdSelector
 * 
 * @spec CSS Selectors §4.2 - ID selectors
 * @spec CSSOM §5.2 - Serializing selectors
 * 
 * @see https://drafts.csswg.org/selectors/#id-selector
 */
export class IdSelector {
  public readonly idName: string;
  public readonly selectorText: string;

  /**
   * Create IdSelector
   * 
   * @param idName - CSS ID name (without hash)
   * @returns IdSelector instance
   * 
   * @see https://drafts.csswg.org/selectors/#id-selector
   */
  constructor(idName: string) {
    this.idName = idName;
    this.selectorText = `#${idName}`;
  }

/**
 * Type selector (element name)
 * @spec https://drafts.csswg.org/selectors-4/#type-selectors
 */
export class TypeSelector {
  public readonly elementName: string;
  public readonly namespace: string | null;
  public readonly selectorText: string;

  /**
   * Create TypeSelector
   * 
   * @param elementName - Element name or * for universal selector
   * @param namespace - Optional namespace prefix (null for default namespace)
   * @returns TypeSelector instance
   * 
   * @see https://drafts.csswg.org/selectors/#type-selector
   */
  constructor(elementName: string, namespace?: string) {
    this.elementName = elementName;
    this.namespace = namespace ?? null;
    
    if (this.namespace) {
      this.selectorText = `${namespace}|${elementName}`;
    } else if (elementName === "*") {
      this.selectorText = "*";
    } else {
      this.selectorText = elementName;
    }
  }

  /**
   * Get selector text
   * 
   * @returns Serialized selector
   * 
   * @implements CSSOM §5.2 - Type selector serialization
   * @see https://drafts.csswg.org/cssom-1/#serializing-selectors
   */
  get selector(): string {
    return this.selectorText;
  }

  /**
   * Convert to string (CSSOM toString)
   * 
   * @returns CSS string representation
   */
  toString(): string {
    return this.selectorText;
  }
}

/**
 * CSSOM AttributeSelector
 * 
 * @spec CSS Selectors §4.7 - Attribute selectors
 * @spec CSSOM §5.2 - Serializing selectors
 * 
 * @see https://drafts.csswg.org/selectors/#attribute-selector
 */
export class AttributeSelector {
  public readonly name: string;
  public readonly namespace: string | null;
  public readonly operator: string | null;
  public readonly value: string | null;
  public readonly flags: string | null;
  public readonly selectorText: string;

  /**
   * Attribute selector operators
   * 
   * @see https://drafts.csswg.org/selectors/#attribute-selector
   */
  static Operators = {
    Equals: "=",
    Contains: "~=",
    StartsWith: "|=",
    StartsWithHyphen: "^=",
    EndsWith: "$=",
    SubstringMatch: "*=",
  } as const;

  /**
   * Attribute selector flags
   * 
   * @see https://drafts.csswg.org/selectors/#case-insensitive
   */
  static Flags = {
    CaseInsensitive: "i",
    CaseSensitive: "s",
  } as const;

  /**
   * Create AttributeSelector
   * 
   * @param name - Attribute name
   * @param options - Optional selector options
   * @returns AttributeSelector instance
   * 
   * @see https://drafts.csswg.org/selectors/#attribute-selector
   */
  constructor(
    name: string,
    options?: {
      namespace?: string;
      operator?: string;
      value?: string;
      flags?: string;
    }
  ) {
    this.name = name;
    this.namespace = options?.namespace ?? null;
    this.operator = options?.operator ?? null;
    this.value = options?.value ?? null;
    this.flags = options?.flags ?? null;
    
    let text = "[";
    
    if (this.namespace) {
      text += `${this.namespace}|`;
    }
    
    text += name;
    
    if (this.operator) {
      text += this.operator;
    }
    
    if (this.value !== undefined && this.value !== null) {
      text += `"${this.value}"`;
    }
    
    if (this.flags) {
      text += this.flags;
    }
    
    text += "]";
    
    this.selectorText = text;
  }

  /**
   * Get selector text
   * 
   * @returns Serialized selector
   * 
   * @implements CSSOM §5.2 - Attribute selector serialization
   * @see https://drafts.csswg.org/cssom-1/#serializing-selectors
   */
  get selector(): string {
    return this.selectorText;
  }

  /**
   * Convert to string (CSSOM toString)
   * 
   * @returns CSS string representation
   */
  toString(): string {
    return this.selectorText;
  }
}

/**
 * CSSOM PseudoClassSelector
 * 
 * @spec CSS Selectors §5 - Structural pseudo-classes
 * @spec CSSOM §5.2 - Serializing selectors
 * 
 * @see https://drafts.csswg.org/selectors/#pseudo-classes
 */
export class PseudoClassSelector {
  public readonly name: string;
  public readonly args: string[];
  public readonly selectorText: string;

  /**
   * Create PseudoClassSelector
   * 
   * @param name - Pseudo-class name (without colon)
   * @param args - Optional arguments for pseudo-class
   * @returns PseudoClassSelector instance
   * 
   * @see https://drafts.csswg.org/selectors/#pseudo-classes
   */
  constructor(name: string, args?: string[]) {
    this.name = name;
    this.args = args ?? [];
    
    if (this.args.length > 0) {
      this.selectorText = `:${name}(${this.args.join(", ")})`;
    } else {
      this.selectorText = `:${name}`;
    }
  }

  /**
   * Get selector text
   * 
   * @returns Serialized selector
   * 
   * @implements CSSOM §5.2 - Pseudo-class selector serialization
   * @see https://drafts.csswg.org/cssom-1/#serializing-selectors
   */
  get selector(): string {
    return this.selectorText;
  }

  /**
   * Convert to string (CSSOM toString)
   * 
   * @returns CSS string representation
   */
  toString(): string {
    return this.selectorText;
  }
}

/**
 * CSSOM PseudoElementSelector
 * 
 * @spec CSS Selectors §6 - Pseudo-elements
 * @spec CSSOM §5.2 - Serializing selectors
 * 
 * @see https://drafts.csswg.org/selectors/#pseudo-element
 */
export class PseudoElementSelector {
  public readonly name: string;
  public readonly args: string[];
  public readonly selectorText: string;

  /**
   * Create PseudoElementSelector
   * 
   * @param name - Pseudo-element name (without double colon)
   * @param args - Optional arguments for pseudo-element
   * @returns PseudoElementSelector instance
   * 
   * @see https://drafts.csswg.org/selectors/#pseudo-element
   */
  constructor(name: string, args?: string[]) {
    this.name = name;
    this.args = args ?? [];
    
    if (this.args.length > 0) {
      this.selectorText = `::${name}(${this.args.join(", ")})`;
    } else {
      this.selectorText = `::${name}`;
    }
  }

  /**
   * Get selector text
   * 
   * @returns Serialized selector
   * 
   * @implements CSSOM §5.2 - Pseudo-element selector serialization
   * @see https://drafts.csswg.org/cssom-1/#serializing-selectors
   */
  get selector(): string {
    return this.selectorText;
  }

  /**
   * Convert to string (CSSOM toString)
   * 
   * @returns CSS string representation
   */
  toString(): string {
    return this.selectorText;
  }
}

/**
 * CSSOM Combinator
 * 
 * @spec CSS Selectors §4.1 - Combinators
 * @spec CSSOM §5.2 - Serializing selectors
 * 
 * @see https://drafts.csswg.org/selectors/#combinators
 */
export class Combinator {
  public readonly kind: string;
  public readonly selectorText: string;

  /**
   * Combinator types
   * 
   * @see https://drafts.csswg.org/selectors/#combinators
   */
  static Kinds = {
    Descendant: "descendant",
    Child: "child",
    AdjacentSibling: "adjacent-sibling",
    GeneralSibling: "general-sibling",
  } as const;

  /**
   * Create Combinator
   * 
   * @param kind - Combinator kind (descendant, child, adjacent-sibling, general-sibling)
   * @returns Combinator instance
   * 
   * @see https://drafts.csswg.org/selectors/#combinators
   */
  constructor(kind: string) {
    this.kind = kind;
    
    const mapping = {
      descendant: " ",
      child: " >",
      "adjacent-sibling": "+",
      "general-sibling": "~",
    };
    
    this.selectorText = mapping[kind as keyof typeof mapping] || " ";
  }

  /**
   * Get selector text
   * 
   * @returns Serialized combinator
   * 
   * @implements CSSOM §5.2 - Combinator serialization
   * @see https://drafts.csswg.org/cssom-1/#serializing-selectors
   */
  get selector(): string {
    return this.selectorText;
  }

  /**
   * Convert to string (CSSOM toString)
   * 
   * @returns CSS string representation
   */
  toString(): string {
    return this.selectorText;
  }
}
