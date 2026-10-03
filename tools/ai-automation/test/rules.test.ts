import { describe, it } from 'vite-plus/test';
import { RuleTester } from 'oxlint/plugins-dev';
import { asTestableRule } from '../src/oxlint-rule-bridge.ts';
import { noArrayFilterMapRule } from '../vendor/anti-slop/rules/no-array-filter-map.ts';
import noBannedTypeAssertions from '../src/rules/no-banned-type-assertions.ts';
import noCascadingLayerProvide from '../src/rules/no-cascading-layer-provide.ts';
import noEffectAsvoid from '../src/rules/no-effect-asvoid.ts';
import noGlobalJson from '../src/rules/no-global-json.ts';
import noInOperator from '../src/rules/no-in-operator.ts';
import { noKnownValueWideningRule } from '../vendor/anti-slop/rules/no-known-value-widening.ts';
import { noManualEffectErrorTagRule } from '../vendor/anti-slop/effect/rules/no-manual-effect-error-tag.ts';
import { noManualTagComparisonRule } from '../vendor/anti-slop/effect/rules/no-manual-tag-comparison.ts';
import { noManualTaggedConstructionRule } from '../vendor/anti-slop/effect/rules/no-manual-tagged-construction.ts';
import { noModuleMockingRule } from '../vendor/anti-slop/rules/no-module-mocking.ts';
import noMultipleFunctionParams from '../src/rules/no-multiple-function-params.ts';
import noNestedEffectArrayMethods from '../src/rules/no-nested-effect-array-methods.ts';
import noNestedLayerProvide from '../src/rules/no-nested-layer-provide.ts';
import { noObjectParametersRule } from '../vendor/anti-slop/rules/no-object-parameters.ts';
import noOptionalFunctionParameters from '../src/rules/no-optional-function-parameters.ts';
import { noReduceAccumulatorCopyRule } from '../vendor/anti-slop/rules/no-reduce-accumulator-copy.ts';
import { noReflectApplyRule } from '../vendor/anti-slop/rules/no-reflect-apply.ts';
import { noReflectGetRule } from '../vendor/anti-slop/rules/no-reflect-get.ts';
import { noServiceConstructorImportsRule } from '../vendor/anti-slop/effect/rules/no-service-constructor-imports.ts';
import noShadowedStandardArrayStatic from '../src/rules/no-shadowed-standard-array-static.ts';
import noSilentErrorSwallow from '../src/rules/no-silent-error-swallow.ts';
import noStaticEffectServiceForwarders from '../src/rules/no-static-effect-service-forwarders.ts';
import noTryCatch from '../src/rules/no-try-catch.ts';
import noTypeAssertion from '../src/rules/no-type-assertion.ts';
import noTypeofObject from '../src/rules/no-typeof-object.ts';
import { noUnknownParametersRule } from '../vendor/anti-slop/rules/no-unknown-parameters.ts';
import { noUnknownReturnsRule } from '../vendor/anti-slop/rules/no-unknown-returns.ts';
import { noUnknownTypeAliasesRule } from '../vendor/anti-slop/rules/no-unknown-type-aliases.ts';
import { noUnsafeDictionaryTypeRule } from '../vendor/anti-slop/rules/no-unsafe-dictionary-type.ts';
import { noWidenThenAssertRule } from '../vendor/anti-slop/rules/no-widen-then-assert.ts';
import pipeMaxArguments from '../src/rules/pipe-max-arguments.ts';
import preferEffectMatch from '../src/rules/prefer-effect-match.ts';
import preferOptionFromNullable from '../src/rules/prefer-option-from-nullable.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: 'module',
    parserOptions: {
      lang: 'ts',
    },
  },
});

tester.run('no-banned-type-assertions', noBannedTypeAssertions, {
  valid: [
    'const value = input as string;',
    'const value = input as { id: string };',
    'const value = input satisfies unknown;',
    'const value = value as const;',
    'const value = <string>input;',
  ],
  invalid: [
    {
      code: 'const value = input as any;',
      errors: [/Do not assert to any, never, or unknown/],
    },
    {
      code: 'const value = input as never;',
      errors: [/Do not assert to any, never, or unknown/],
    },
    {
      code: 'const value = input as unknown;',
      errors: [/Do not assert to any, never, or unknown/],
    },
    {
      code: 'const value = <any>input;',
      errors: [/Do not assert to any, never, or unknown/],
    },
    {
      code: 'const value = <never>input;',
      errors: [/Do not assert to any, never, or unknown/],
    },
    {
      code: 'const value = <unknown>input;',
      errors: [/Do not assert to any, never, or unknown/],
    },
  ],
});

tester.run('prefer-effect-match', preferEffectMatch, {
  valid: [
    "const value = input === 'a' ? 1 : 2;",
    "const value = input === 'a' ? 1 : other === 'b' ? 2 : 3;",
    'const value = ready ? 1 : loading ? 2 : 3;',
    "const value = Match.value(input).pipe(Match.when('a', () => 1), Match.when('b', () => 2), Match.orElse(() => 3));",
  ],
  invalid: [
    {
      code: "const value = input === 'a' ? 1 : input === 'b' ? 2 : 3;",
      errors: [/Use Match from effect/],
    },
    {
      code: "const value = 'a' !== state.view ? 1 : 'b' !== state.view ? 2 : 3;",
      errors: [/Use Match from effect/],
    },
    {
      code: 'const value = input === `a` ? 1 : input === `b` ? 2 : 3;',
      errors: [/Use Match from effect/],
    },
  ],
});

tester.run('no-type-assertion', noTypeAssertion, {
  valid: [
    'const value = value as const;',
    "const machine = setup({ types: { input: {} as { id: string }, context: {} as { id: string }, events: {} as { type: 'x' }, children: {} as { child: 'actor' }, output: {} as { id: string } } });",
    'const store = createStore({ context: { visited: false } as { visited: boolean }, on: {} });',
    'const value = input satisfies { id: string };',
  ],
  invalid: [
    {
      code: 'const value = input as string;',
      errors: [/Avoid type assertions/],
    },
    {
      code: 'const value = input as { id: string };',
      errors: [/Avoid type assertions/],
    },
    {
      code: 'const value = <string>input;',
      errors: [/Avoid type assertions/],
    },
  ],
});

tester.run('no-effect-asvoid', noEffectAsvoid, {
  valid: [
    'program.pipe(Effect.as(undefined));',
    'Effect.as(undefined)(program);',
  ],
  invalid: [
    {
      code: 'program.pipe(Effect.asVoid);',
      errors: [/Avoid Effect.asVoid/],
    },
    {
      code: 'Effect.asVoid(program);',
      errors: [/Avoid Effect.asVoid/],
    },
  ],
});

tester.run('no-global-json', asTestableRule(noGlobalJson), {
  valid: [
    'Schema.encodeEffect(Schema.fromJsonString(Schema.Json))(value);',
    'const codec = { JSON: { stringify: value => value } }; codec.JSON.stringify(value);',
  ],
  invalid: [
    {
      code: 'JSON.stringify(value);',
      errors: [/Do not use the global JSON API/],
    },
    {
      code: 'globalThis.JSON.parse(value);',
      errors: [/Do not use the global JSON API/],
    },
  ],
});

tester.run('no-multiple-function-params', noMultipleFunctionParams, {
  valid: [
    'function save({ id, value }) { return id + value; }',
    'const save = ({ id, value }) => id + value;',
    'values.map((value, index) => value + index);',
    {
      code: 'export async function GET(request, { params }) { return Response.json(await params); }',
      filename: '/repo/applications/web/app/api/items/[id]/route.ts',
    },
    {
      code: 'export async function POST(request, { params }) { return Response.json(await params); }',
      filename: '/repo/applications/web/app/api/items/[id]/route.tsx',
    },
  ],
  invalid: [
    {
      code: 'function save(id, value) { return id + value; }',
      errors: [/Functions with more than one parameter/],
    },
    {
      code: 'const save = (id, value) => id + value;',
      errors: [/Functions with more than one parameter/],
    },
    {
      code: 'export async function GET(request, params) { return Response.json(params); }',
      filename: '/repo/applications/web/app/api/items/[id]/handler.ts',
      errors: [/Functions with more than one parameter/],
    },
  ],
});

tester.run('no-in-operator', noInOperator, {
  valid: [
    "const supported = Object.hasOwn(navigator, 'wakeLock');",
    {
      code: "const supported = Object.hasOwn(node, 'type');",
      filename: '/repo/modules/oxc/src/oxlint/rules/example.ts',
    },
  ],
  invalid: [
    {
      code: "const supported = 'wakeLock' in navigator;",
      filename: '/repo/applications/web/src/example.ts',
      errors: [/Do not use the "in" operator/],
    },
  ],
});

tester.run('no-nested-effect-array-methods', noNestedEffectArrayMethods, {
  valid: [
    "import { Array } from 'effect'; Array.filter(values, predicate);",
    "import { Array as EffectArray } from 'effect'; EffectArray.filter(values, value => Array.contains(ids, value.id));",
    "import { Array } from 'effect'; const contains = Array.contains(ids); Array.filter(values, value => contains(value.id));",
  ],
  invalid: [
    {
      code: "import { Array } from 'effect'; Array.filter(values, value => Array.contains(ids, value.id));",
      errors: [/Do not nest Effect Array method calls/],
    },
    {
      code: "import { Array } from 'effect'; Array.map(Array.filter(values, predicate), mapper);",
      errors: [/Do not nest Effect Array method calls/],
    },
  ],
});

tester.run(
  'no-static-effect-service-forwarders',
  noStaticEffectServiceForwarders,
  {
    valid: [
      "import { Effect } from 'effect'; Effect.gen(function* () { const service = yield* Preferences; return yield* service.get; });",
      "import { Effect } from 'effect'; class Preferences { static readonly get = Effect.flatMap(Effect.service(this), (_) => { const value = _.get; return Effect.succeed(value); }); }",
      "import { Effect } from 'effect'; const get = Effect.flatMap(Effect.service(this), (_) => _.get);",
      "import { Effect } from 'effect'; class Preferences { static readonly get = (() => { const Effect = customEffect; return Effect.flatMap(Effect.service(this), (_) => _.get); })(); }",
      'class Preferences { static readonly get = Effect.flatMap(Effect.service(this), (_) => _.get); }',
    ],
    invalid: [
      {
        code: "import { Effect } from 'effect'; class Preferences { static readonly get = Effect.flatMap(Effect.service(this), (_) => _.get); }",
        errors: [
          /Do not expose an Effect service method through a static forwarder/,
        ],
      },
      {
        code: "import { Effect as Fx } from 'effect'; class Preferences { static readonly get = (input) => Fx.flatMap(Fx.service(this), (service) => service.get(input)); }",
        errors: [
          /Do not expose an Effect service method through a static forwarder/,
        ],
      },
      {
        code: "import { Effect } from 'effect'; class Preferences { static readonly get = Effect.service(this).pipe(Effect.flatMap((_) => _.get)); }",
        errors: [
          /Do not expose an Effect service method through a static forwarder/,
        ],
      },
      {
        code: "import { Effect, pipe as compose } from 'effect'; class Preferences { static readonly get = compose(Effect.service(this), Effect.flatMap((_) => { return _.get; })); }",
        errors: [
          /Do not expose an Effect service method through a static forwarder/,
        ],
      },
      {
        code: "import { flatMap as chain, service as acquire } from 'effect/Effect'; class Preferences { static readonly get = chain(acquire(this), (_) => _.get()); }",
        errors: [
          /Do not expose an Effect service method through a static forwarder/,
        ],
      },
      {
        code: "import * as Fx from 'effect/Effect'; class Preferences { static readonly get = Fx.flatMap(Fx.service(this), (_) => _.get); }",
        errors: [
          /Do not expose an Effect service method through a static forwarder/,
        ],
      },
    ],
  },
);

tester.run('no-silent-error-swallow', noSilentErrorSwallow, {
  valid: [
    'effect.pipe(Effect.catch((error) => Effect.logError(error)));',
    'effect.pipe(Effect.catch(() => Effect.fail(error)));',
    'effect.pipe(Effect.catchTags({ NotFound: () => Effect.succeed(null) }));',
  ],
  invalid: [
    {
      code: 'effect.pipe(Effect.catch(() => Effect.void));',
      errors: [/Do not silently swallow Effect errors/],
    },
    {
      code: 'effect.pipe(Effect.catch(() => { return Effect.unit; }));',
      errors: [/Do not silently swallow Effect errors/],
    },
    {
      code: 'effect.pipe(Effect.catchTags({ NotFound: () => Effect.void }));',
      errors: [/Do not silently swallow Effect errors/],
    },
  ],
});

tester.run('no-optional-function-parameters', noOptionalFunctionParameters, {
  valid: [
    'function _save(value: string | undefined) { return value; }',
    'const _save = (value: string | null) => value;',
    'type Params = { value?: string };',
    'interface Params { value?: string }',
  ],
  invalid: [
    {
      code: 'function _save(value?: string) { return value; }',
      errors: [/Optional function parameters are banned/],
    },
    {
      code: 'const _save = (value?: string) => value;',
      errors: [/Optional function parameters are banned/],
    },
    {
      code: 'class Service { constructor(private readonly value?: string) {} }',
      errors: [/Optional function parameters are banned/],
    },
  ],
});

tester.run('no-nested-layer-provide', noNestedLayerProvide, {
  valid: [
    'Layer.provide(AppLayer, DependenciesLayer);',
    'Layer.provideMerge(AppLayer, DependenciesLayer);',
  ],
  invalid: [
    {
      code: 'Layer.provide(AppLayer, Layer.provide(ServiceLayer, DependenciesLayer));',
      errors: [/Avoid nested Layer.provide calls/],
    },
  ],
});

tester.run('no-cascading-layer-provide', noCascadingLayerProvide, {
  valid: [
    'import { Layer } from "effect"; Service.layer.pipe(Layer.provide([Repository.layer, Client.layer]));',
    'import { Layer } from "effect"; const ConfiguredRuntime = Runtime.layer.pipe(Layer.provide(Config.layer)); App.layer.pipe(Layer.provide(ConfiguredRuntime));',
    'import { Layer as EffectLayer } from "effect"; Service.layer.pipe(EffectLayer.provide([Repository.layer, Client.layer]));',
    'const Layer = { provide: (layer: unknown) => layer }; Service.layer.pipe(Layer.provide(Repository.layer), Layer.provide(Client.layer));',
  ],
  invalid: [
    {
      code: 'import { Layer } from "effect"; Service.layer.pipe(Layer.provide(Repository.layer), Layer.provide(Client.layer));',
      errors: [/Avoid multiple Layer\.provide/],
    },
    {
      code: 'import { Layer } from "effect"; Service.layer.pipe(Layer.provide(Repository.layer), Layer.provideMerge(Client.layer));',
      errors: [/Avoid multiple Layer\.provide/],
    },
    {
      code: 'import { Layer as EffectLayer } from "effect"; Service.layer.pipe(EffectLayer.provide(Repository.layer), EffectLayer.provide(Client.layer));',
      errors: [/Avoid multiple Layer\.provide/],
    },
  ],
});

tester.run('no-shadowed-standard-array-static', noShadowedStandardArrayStatic, {
  valid: [
    'Array.from(values);',
    "import { Array as EffectArray } from 'effect'; Array.from(values); EffectArray.map(values, value => value);",
    "import { Array } from 'effect'; globalThis.Array.from(values);",
    "import { Array } from 'effect'; Array.map(values, value => value);",
  ],
  invalid: [
    {
      code: "import { Array } from 'effect'; Array.from(values);",
      errors: [/Use globalThis.Array/],
    },
    {
      code: "import { Array } from 'effect'; Array.isArray(values);",
      errors: [/Use globalThis.Array/],
    },
    {
      code: "import { Array } from 'effect'; Array.of(value);",
      errors: [/Use globalThis.Array/],
    },
  ],
});

tester.run('no-typeof-object', noTypeofObject, {
  valid: [
    "const valid = typeof value !== 'string';",
    {
      code: 'const valid = node !== null;',
      filename: '/repo/modules/oxc/src/oxlint/rules/example.ts',
    },
  ],
  invalid: [
    {
      code: "const invalid = typeof value !== 'object';",
      filename: '/repo/applications/web/src/example.ts',
      errors: [/Do not compare typeof values with "object"/],
    },
    {
      code: "const invalid = typeof value === 'object';",
      filename: '/repo/applications/server/src/example.ts',
      errors: [/Do not compare typeof values with "object"/],
    },
    {
      code: "const invalid = 'object' !== typeof value;",
      filename: '/repo/modules/contracts/src/example.ts',
      errors: [/Do not compare typeof values with "object"/],
    },
    {
      code: "const invalid = typeof value != 'object';",
      filename: '/repo/modules/contracts/src/example.ts',
      errors: [/Do not compare typeof values with "object"/],
    },
    {
      code: "const invalid = value !== null && typeof value === 'object';",
      filename: '/repo/applications/web/src/example.ts',
      errors: [/Do not compare typeof values with "object"/],
    },
  ],
});

tester.run('no-try-catch', asTestableRule(noTryCatch), {
  valid: [
    'Effect.try({ try: () => parse(value), catch: (cause) => new Error(String(cause)) });',
    'Effect.tryPromise({ try: () => request(), catch: (cause) => new Error(String(cause)) });',
  ],
  invalid: [
    {
      code: 'try { parse(value); } catch { fallback(); }',
      errors: [/Do not use try\/catch/],
    },
  ],
});

tester.run('pipe-max-arguments', pipeMaxArguments, {
  valid: [
    'effect.pipe(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20);',
  ],
  invalid: [
    {
      code: 'effect.pipe(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21);',
      errors: [/This pipe has too many arguments/],
    },
  ],
});

tester.run('prefer-option-from-nullable', preferOptionFromNullable, {
  valid: [
    'const value = Option.fromNullable(input);',
    'const value = input === null ? Option.none() : Option.some(input);',
    'const value = input !== undefined ? Option.some(input) : Option.none();',
  ],
  invalid: [
    {
      code: 'const value = input !== null ? Option.some(input) : Option.none();',
      errors: [/Use Option.fromNullable/],
    },
    {
      code: 'const value = null != input ? Option.some(input) : Option.none();',
      errors: [/Use Option.fromNullable/],
    },
    {
      code: 'const value = input !== null ? Option.some<string>(input) : Option.none();',
      errors: [/Use Option.fromNullable/],
    },
  ],
});

// Vendored anti-slop rules. See vendor/anti-slop/UPSTREAM.md for provenance and
// the list of intentionally unadopted rules.

tester.run('no-array-filter-map', asTestableRule(noArrayFilterMapRule), {
  valid: [
    'const users: User[] = []; users.values().filter(active).map(email).toArray();',
    'function collect(users: IteratorObject<User>) { return users.filter(active).map(email).toArray(); }',
    'const users: User[] = []; users.flatMap((user) => (user.active ? [user.email] : []));',
    'const users: User[] = []; users.map(email); users.filter(active);',
  ],
  invalid: [
    {
      code: '[].filter(active).map(email);',
      errors: [{ messageId: 'arrayFilterMap' }],
    },
    {
      code: 'const users: User[] = []; users.map(email).filter(Boolean);',
      errors: [{ messageId: 'arrayFilterMap' }],
    },
    {
      code: 'function collect(users: User[]) { return users.filter(active).map(email); }',
      errors: [{ messageId: 'arrayFilterMap' }],
    },
  ],
});

tester.run(
  'no-reduce-accumulator-copy',
  asTestableRule(noReduceAccumulatorCopyRule),
  {
    valid: [
      'items.reduce((acc, item) => { acc.push(item); return acc; }, []);',
      'items.reduce((acc, item) => Object.assign(acc, item), {});',
      "items.reduce((acc, item) => acc.concat(item), '');",
      'items.reduce((acc, item) => [...acc, item], []);',
    ],
    invalid: [
      {
        code: 'items.reduce((acc, item) => Object.assign({}, acc, { [item.id]: item }), {});',
        errors: [{ messageId: 'accumulatorCopy' }],
      },
      {
        code: 'items.reduce((acc, item) => { const next = acc.slice(); next.push(item); return next; }, []);',
        errors: [{ messageId: 'accumulatorCopy' }],
      },
      {
        code: 'items.reduce((acc, item) => acc.concat([item]), []);',
        errors: [{ messageId: 'accumulatorCopy' }],
      },
    ],
  },
);

tester.run('no-object-parameters', asTestableRule(noObjectParametersRule), {
  valid: [
    'function f<Value>(value: Value) {}',
    'function f<Value extends object>(value: Value) {}',
    'type Owner = { readonly id: string }; function f<Value extends Owner>(value: Value) {}',
  ],
  invalid: [
    {
      code: 'function f(value: object) {}',
      errors: [{ messageId: 'objectParameter' }],
    },
    {
      code: 'type Alias = object; function f(value: Alias) {}',
      errors: [{ messageId: 'objectParameter' }],
    },
    {
      code: 'type Identity<T> = T; function consume(value: Identity<object>) {}',
      errors: [{ messageId: 'objectParameter' }],
    },
  ],
});

tester.run('no-unknown-parameters', asTestableRule(noUnknownParametersRule), {
  valid: [
    'function isString(value: unknown): value is string { return true; }',
    'function enrich(cause: unknown): void {}',
    'function parse(value: string | number): void {}',
  ],
  invalid: [
    {
      code: 'function parse(value: unknown): void {}',
      errors: [{ messageId: 'unknownParameter' }],
    },
    {
      code: 'function isString(value: unknown, context: unknown): value is string { return true; }',
      errors: [{ messageId: 'unknownParameter' }],
    },
  ],
});

tester.run('no-unknown-returns', asTestableRule(noUnknownReturnsRule), {
  valid: [
    'function parse(): User { return user; }',
    'function infer() { return input; }',
    'function generic<Value>(): Value { return value; }',
    'function cause(): { cause: unknown } { return { cause: input }; }',
  ],
  invalid: [
    {
      code: 'function load(): unknown { return input; }',
      errors: [{ messageId: 'unknownReturn' }],
    },
    {
      code: 'const load = (): unknown => input;',
      errors: [{ messageId: 'unknownReturn' }],
    },
    {
      code: 'function load(): Promise<unknown> { return promise; }',
      errors: [{ messageId: 'unknownReturn' }],
    },
    {
      code: 'type UnknownValue = unknown; function load(): UnknownValue { return input; }',
      errors: [{ messageId: 'unknownReturn' }],
    },
  ],
});

tester.run(
  'no-unknown-type-aliases',
  asTestableRule(noUnknownTypeAliasesRule),
  {
    valid: [
      'type User = { readonly id: string };',
      'type Alias = string; type UserId = Alias;',
      'type Box<T> = { readonly value: T }; type Payload = Box<unknown>;',
    ],
    invalid: [
      {
        code: 'type Alias = unknown;',
        errors: [{ messageId: 'unknownAlias' }],
      },
      {
        code: 'type Payload = string | unknown;',
        errors: [{ messageId: 'unknownAlias' }],
      },
      {
        code: 'type Identity<T> = T; type Payload = Identity<unknown>;',
        errors: [{ messageId: 'unknownAlias' }],
      },
    ],
  },
);

tester.run(
  'no-unsafe-dictionary-type',
  asTestableRule(noUnsafeDictionaryTypeRule),
  {
    valid: [
      'type Commands = Record<string, Command>;',
      'type Indexed = { [key: string]: Command };',
      'type PermissionLevels = Record<Permission, number>;',
      'type WithSchema<T extends Record<string, unknown>> = (schema: T) => void;',
    ],
    invalid: [
      {
        code: 'type A = Record<string, unknown>;',
        errors: [{ messageId: 'unsafeDictionary' }],
      },
      {
        code: 'type A = { [key: string]: any };',
        errors: [{ messageId: 'unsafeDictionary' }],
      },
      {
        code: 'type A = Record<string, {}>;',
        errors: [{ messageId: 'unsafeDictionary' }],
      },
      {
        code: 'type A = { readonly [key: string]: unknown };',
        errors: [{ messageId: 'unsafeDictionary' }],
      },
    ],
  },
);

const wideningPrelude =
  'type Command = () => void; const startCommand = () => {};';

tester.run(
  'no-known-value-widening',
  asTestableRule(noKnownValueWideningRule),
  {
    valid: [
      `${wideningPrelude} const commands = { start: startCommand };`,
      `${wideningPrelude} const commands = { start: startCommand } satisfies Record<string, Command>;`,
      `${wideningPrelude} function isString(value: unknown): value is string { return true; } isString(input);`,
    ],
    invalid: [
      {
        code: 'const value: unknown = {};',
        errors: [{ messageId: 'widening' }],
      },
      {
        code: `${wideningPrelude} const commands: Record<string, Command> = { start: startCommand };`,
        errors: [{ messageId: 'widening' }],
      },
      {
        code: "function isString(value: unknown): value is string { return true; } isString('known');",
        errors: [{ messageId: 'widening' }],
      },
    ],
  },
);

tester.run('no-widen-then-assert', asTestableRule(noWidenThenAssertRule), {
  valid: [
    "const source = { id: 'first' }; const widened: unknown = source;",
    'declare const input: unknown; const parsed = input as { readonly id: string };',
  ],
  invalid: [
    {
      code: "const source = { id: 'second' }; const widened: unknown = source; const parsed = widened as { readonly id: string };",
      errors: [{ messageId: 'widenThenAssert' }],
    },
  ],
});

tester.run('no-reflect-get', asTestableRule(noReflectGetRule), {
  valid: [
    'const value = owner.property;',
    'const Reflect = { get() { return 1; } }; Reflect.get();',
  ],
  invalid: [
    {
      code: 'const value = Reflect.get(owner, key);',
      errors: [{ messageId: 'reflectGet' }],
    },
    {
      code: "const value = Reflect['get'](owner, key);",
      errors: [{ messageId: 'reflectGet' }],
    },
  ],
});

tester.run('no-reflect-apply', asTestableRule(noReflectApplyRule), {
  valid: [
    'const value = operation.apply(owner, args);',
    'Reflect.get(owner, key);',
  ],
  invalid: [
    {
      code: 'const value = Reflect.apply(operation, owner, args);',
      errors: [{ messageId: 'reflectApply' }],
    },
    {
      code: "const value = Reflect['apply'](operation, owner, args);",
      errors: [{ messageId: 'reflectApply' }],
    },
  ],
});

tester.run('no-module-mocking', asTestableRule(noModuleMockingRule), {
  valid: [
    'const store = new InMemoryUserStore();',
    "vi.spyOn(store, 'save');",
    'const vi = { mock() {} }; vi.mock();',
  ],
  invalid: [
    {
      code: "vi.mock('./user-store');",
      errors: [{ messageId: 'moduleMock' }],
    },
    {
      code: "jest.mock('./user-store');",
      errors: [{ messageId: 'moduleMock' }],
    },
    {
      code: "jest.unstable_mockModule('./user-store');",
      errors: [{ messageId: 'moduleMock' }],
    },
  ],
});

tester.run(
  'no-manual-tag-comparison',
  asTestableRule(noManualTagComparisonRule),
  {
    valid: [
      'Predicate.isTagged("Ready")(value);',
      'if (value.status === "Ready") handleReady(value);',
      'Effect.catch((error) => error._tag === "NotFound" ? recover : fail);',
    ],
    invalid: [
      {
        code: 'value._tag === "Ready";',
        errors: [{ messageId: 'manualComparison' }],
      },
      {
        code: '"Ready" !== value["_tag"];',
        errors: [{ messageId: 'manualComparison' }],
      },
      {
        code: 'switch (value._tag) { case "Ready": handleReady(value); }',
        errors: [{ messageId: 'manualSwitch' }],
      },
    ],
  },
);

tester.run(
  'no-manual-effect-error-tag',
  asTestableRule(noManualEffectErrorTagRule),
  {
    valid: [
      'error._tag === "NotFound";',
      'Effect.catchTag("NotFound", recover);',
    ],
    invalid: [
      {
        code: 'Effect.catch((error) => error._tag === "NotFound" ? recover : fail);',
        errors: [{ messageId: 'tag' }],
      },
      {
        code: 'Effect.catchAll(function (error) { return error.reason._tag === "Timeout" ? retry : fail; });',
        errors: [{ messageId: 'reason' }],
      },
    ],
  },
);

tester.run(
  'no-manual-tagged-construction',
  asTestableRule(noManualTaggedConstructionRule),
  {
    valid: [
      'Match.when({ _tag: "Ready" }, handleReady);',
      'Ready.make({ value });',
    ],
    invalid: [
      {
        code: 'const value = { _tag: "Ready", payload };',
        errors: [{ messageId: 'manualConstruction' }],
      },
      {
        code: 'const value = { ["_tag"]: "Ready" };',
        errors: [{ messageId: 'manualConstruction' }],
      },
    ],
  },
);

tester.run(
  'no-service-constructor-imports',
  asTestableRule(noServiceConstructorImportsRule),
  {
    valid: [
      {
        filename: 'src/issue-service.test.ts',
        code: 'import { makeIssueService } from "./issue-service.ts";',
      },
      {
        filename: 'src/runtime.ts',
        code: 'import { makeExecutionMemo } from "alchemy/Runtime/ExecutionMemo";',
      },
    ],
    invalid: [
      {
        filename: 'src/runtime.ts',
        code: 'import { makeIssueService } from "./issue-service.ts";',
        errors: [{ messageId: 'serviceConstructorImport' }],
      },
      {
        filename: 'src/runtime.ts',
        code: 'import { makeIssueService as createIssueService } from "../issue-service.ts";',
        errors: [{ messageId: 'serviceConstructorImport' }],
      },
    ],
  },
);
