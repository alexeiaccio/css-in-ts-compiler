/**
 * Dependency-free declarative rule factories on top of the Oxlint plugin API.
 *
 * These exist so trivial "ban this pattern" rules can be declared in a few
 * lines instead of hand-writing visitors. They intentionally cover the edges
 * that simple `obj.prop` matchers miss: chained object paths
 * (`globalThis.JSON.parse`) and computed string properties (`Reflect['get']`).
 *
 * This module is linter implementation, so it is exempt from the rules it
 * implements (see the `tools/ai-automation/src/**` override in
 * `vite.config.ts`). It deliberately does not depend on Effect.
 */

interface BanOptions {
  /** Diagnostic message shown at the offending node. */
  readonly message: string;
  /** `meta.docs.description` for the rule. */
  readonly description: string;
}

/** A static object path: `'JSON'` or `['globalThis', 'JSON']`. */
type ObjectPath = string | readonly string[];

/** A property selector; omit to match any property. */
type PropertySelector = string | readonly string[];

interface MemberTarget {
  /** The object an identifier or static member chain must resolve to. */
  readonly object: ObjectPath;
  /** The property/properties to match. Omit to match any property access. */
  readonly property?: PropertySelector;
}

interface BanSpec {
  /** Bare identifier calls to ban, e.g. `'fetch'` or `['useState']`. */
  readonly calls?: string | readonly string[];
  /** `new` expressions to ban, e.g. `'Date'`. */
  readonly newExprs?: string | readonly string[];
  /** Member accesses to ban. */
  readonly members?: readonly MemberTarget[];
  /** Member calls to ban (`obj.prop(...)`). */
  readonly memberCalls?: readonly MemberTarget[];
  /** Import sources to ban: a string or a predicate. */
  readonly imports?: readonly (string | ((source: string) => boolean))[];
  /** Statement node types to ban, e.g. `'TryStatement'`. */
  readonly statements?: readonly string[];
}

interface BanContext {
  readonly report: (descriptor: {
    readonly node: unknown;
    readonly message: string;
  }) => void;
}

type Handler = (node: unknown) => void;
type VisitorMap = Record<string, Handler>;

interface BanRule {
  readonly meta: {
    readonly type: 'problem';
    readonly docs: { readonly description: string };
  };
  readonly create: (context: BanContext) => VisitorMap;
}

type AstNode = { readonly type: string; readonly [key: string]: unknown };

const isNode = (value: unknown): value is AstNode =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { readonly type?: unknown }).type === 'string';

const identifierName = (node: unknown): string | undefined =>
  isNode(node) && node.type === 'Identifier' && typeof node.name === 'string'
    ? node.name
    : undefined;

const memberPropertyName = (node: unknown): string | undefined => {
  if (!isNode(node) || node.type !== 'MemberExpression') {
    return undefined;
  }
  if (node.computed === true) {
    return isNode(node.property) &&
      node.property.type === 'Literal' &&
      typeof node.property.value === 'string'
      ? node.property.value
      : undefined;
  }
  return identifierName(node.property);
};

const toPath = (value: ObjectPath): readonly string[] =>
  typeof value === 'string' ? [value] : value;

const matchesObjectPath = (node: unknown, path: readonly string[]): boolean => {
  if (path.length === 0) {
    return false;
  }
  const last = path.at(-1);
  if (path.length === 1) {
    return identifierName(node) === last;
  }
  if (!isNode(node) || node.type !== 'MemberExpression') {
    return false;
  }
  return (
    memberPropertyName(node) === last &&
    matchesObjectPath(node.object, path.slice(0, -1))
  );
};

const propertyMatches = (
  actual: string | undefined,
  expected: PropertySelector | undefined,
): boolean => {
  if (expected === undefined) {
    return true;
  }
  if (actual === undefined) {
    return false;
  }
  return typeof expected === 'string'
    ? actual === expected
    : expected.includes(actual);
};

const matchesMember = (node: unknown, target: MemberTarget): boolean => {
  if (!isNode(node) || node.type !== 'MemberExpression') {
    return false;
  }
  return (
    matchesObjectPath(node.object, toPath(target.object)) &&
    propertyMatches(memberPropertyName(node), target.property)
  );
};

const matchesMemberCall = (node: unknown, target: MemberTarget): boolean =>
  isNode(node) &&
  node.type === 'CallExpression' &&
  matchesMember(node.callee, target);

const callName = (node: unknown): string | undefined =>
  isNode(node) && node.type === 'CallExpression'
    ? identifierName(node.callee)
    : undefined;

const importSource = (node: unknown): string | undefined => {
  if (!isNode(node) || node.type !== 'ImportDeclaration') {
    return undefined;
  }
  return isNode(node.source) &&
    node.source.type === 'Literal' &&
    typeof node.source.value === 'string'
    ? node.source.value
    : undefined;
};

const toNames = (value: string | readonly string[]): readonly string[] =>
  typeof value === 'string' ? [value] : value;

const isTargetArray = (
  value: MemberTarget | readonly MemberTarget[],
): value is readonly MemberTarget[] => Array.isArray(value);

const mergeVisitors = (visitors: readonly VisitorMap[]): VisitorMap => {
  const merged: VisitorMap = {};
  for (const visitor of visitors) {
    for (const [type, handler] of Object.entries(visitor)) {
      const existing = merged[type];
      merged[type] =
        existing === undefined
          ? handler
          : (node) => {
              existing(node);
              handler(node);
            };
    }
  }
  return merged;
};

const makeRule = ({
  description,
  build,
}: {
  readonly description: string;
  readonly build: (context: BanContext) => VisitorMap;
}): BanRule => ({
  meta: { type: 'problem', docs: { description } },
  create: build,
});

const memberVisitor =
  (
    targets: readonly MemberTarget[],
    message: string,
  ): ((context: BanContext) => VisitorMap) =>
  (context) => ({
    MemberExpression: (node) => {
      if (targets.some((target) => matchesMember(node, target))) {
        context.report({ node, message });
      }
    },
  });

/** Ban member access matching a target (e.g. any `JSON.*`). */
export const banMember = (
  target: MemberTarget | readonly MemberTarget[],
  options: BanOptions,
): BanRule =>
  makeRule({
    description: options.description,
    build: memberVisitor(
      isTargetArray(target) ? target : [target],
      options.message,
    ),
  });

/** Ban method calls matching a member target (e.g. `console.log(...)`). */
export const banCallOfMember = (
  target: MemberTarget | readonly MemberTarget[],
  options: BanOptions,
): BanRule => {
  const targets = isTargetArray(target) ? target : [target];
  return makeRule({
    description: options.description,
    build: (context) => ({
      CallExpression: (node) => {
        if (targets.some((item) => matchesMemberCall(node, item))) {
          context.report({ node, message: options.message });
        }
      },
    }),
  });
};

/** Ban bare identifier calls (e.g. `fetch(...)`). */
export const banCallOf = (
  name: string | readonly string[],
  options: BanOptions,
): BanRule => {
  const names = toNames(name);
  return makeRule({
    description: options.description,
    build: (context) => ({
      CallExpression: (node) => {
        const actual = callName(node);
        if (actual !== undefined && names.includes(actual)) {
          context.report({ node, message: options.message });
        }
      },
    }),
  });
};

/** Ban `new` expressions with the given callee (e.g. `new Date()`). */
export const banNewExpr = (
  name: string | readonly string[],
  options: BanOptions,
): BanRule => {
  const names = toNames(name);
  return makeRule({
    description: options.description,
    build: (context) => ({
      NewExpression: (node) => {
        const actual = isNode(node) ? identifierName(node.callee) : undefined;
        if (actual !== undefined && names.includes(actual)) {
          context.report({ node, message: options.message });
        }
      },
    }),
  });
};

/** Ban a statement node type (e.g. `TryStatement`). */
export const banStatement = (nodeType: string, options: BanOptions): BanRule =>
  makeRule({
    description: options.description,
    build: (context) => ({
      [nodeType]: (node) => {
        context.report({ node, message: options.message });
      },
    }),
  });

/** Ban imports from a source string or predicate. */
export const banImport = (
  source: string | ((importPath: string) => boolean),
  options: BanOptions,
): BanRule =>
  makeRule({
    description: options.description,
    build: (context) => ({
      ImportDeclaration: (node) => {
        const actual = importSource(node);
        if (actual === undefined) {
          return;
        }
        const matches =
          typeof source === 'function' ? source(actual) : actual === source;
        if (matches) {
          context.report({ node, message: options.message });
        }
      },
    }),
  });

/** Combine several ban patterns under one rule and one message. */
export const banMultiple = (spec: BanSpec, options: BanOptions): BanRule =>
  makeRule({
    description: options.description,
    build: (context) => {
      const visitors: Array<VisitorMap> = [];
      if (spec.statements !== undefined) {
        for (const nodeType of spec.statements) {
          visitors.push(banStatement(nodeType, options).create(context));
        }
      }
      if (spec.members !== undefined && spec.members.length > 0) {
        visitors.push(memberVisitor(spec.members, options.message)(context));
      }
      if (spec.memberCalls !== undefined && spec.memberCalls.length > 0) {
        for (const target of spec.memberCalls) {
          visitors.push(banCallOfMember(target, options).create(context));
        }
      }
      if (spec.calls !== undefined) {
        visitors.push(banCallOf(spec.calls, options).create(context));
      }
      if (spec.newExprs !== undefined) {
        visitors.push(banNewExpr(spec.newExprs, options).create(context));
      }
      if (spec.imports !== undefined) {
        for (const source of spec.imports) {
          visitors.push(banImport(source, options).create(context));
        }
      }
      return mergeVisitors(visitors);
    },
  });
