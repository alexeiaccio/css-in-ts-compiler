export type RuleProfile = 'core' | 'effect' | 'anti-slop';

type RuleSeverity = 'error' | 'warn';

interface OxlintRuleMetadata {
  readonly name: string;
  readonly profile: RuleProfile;
  readonly severity: RuleSeverity;
  readonly description: string;
}

// Rules with pre-existing violations are rolled out as warnings and promoted
// to errors as the debt is burned down. See tools/ai-automation/README.md.
const warningRules = new Set([
  'no-banned-type-assertions',
  'no-global-json',
  'no-in-operator',
  'no-multiple-function-params',
  'no-optional-function-parameters',
  'no-try-catch',
  'no-type-assertion',
  'no-typeof-object',
  'no-cascading-layer-provide',
  'no-effect-asvoid',
  'no-nested-layer-provide',
  'pipe-max-arguments',
  'prefer-option-from-nullable',
  // All vendored anti-slop rules (vendor/anti-slop/UPSTREAM.md) are now at zero
  // violations and promoted to errors. If a new rule is adopted with existing
  // debt, add it here for a warning rollout and remove it once burned down.
]);

const profileRules: Readonly<Record<RuleProfile, ReadonlyArray<string>>> = {
  core: [
    'no-banned-type-assertions',
    'no-multiple-function-params',
    'no-optional-function-parameters',
    'no-type-assertion',
  ],
  effect: [
    'no-cascading-layer-provide',
    'no-effect-asvoid',
    'no-global-json',
    'no-in-operator',
    'no-nested-effect-array-methods',
    'no-nested-layer-provide',
    'no-shadowed-standard-array-static',
    'no-silent-error-swallow',
    'no-static-effect-service-forwarders',
    'no-try-catch',
    'no-typeof-object',
    'pipe-max-arguments',
    'prefer-effect-match',
    'prefer-option-from-nullable',
  ],
  'anti-slop': [
    'no-array-filter-map',
    'no-known-value-widening',
    'no-manual-effect-error-tag',
    'no-manual-tag-comparison',
    'no-manual-tagged-construction',
    'no-module-mocking',
    'no-object-parameters',
    'no-reduce-accumulator-copy',
    'no-reflect-apply',
    'no-reflect-get',
    'no-service-constructor-imports',
    'no-unknown-parameters',
    'no-unknown-returns',
    'no-unknown-type-aliases',
    'no-unsafe-dictionary-type',
    'no-widen-then-assert',
  ],
};

const ruleDescriptions: Readonly<Record<string, string>> = {
  'no-banned-type-assertions':
    'Disallow assertions to any, never, or unknown; fix the type or use generics.',
  'no-cascading-layer-provide':
    'Combine independent Layer dependencies in one provide call instead of chaining stages in a pipe.',
  'no-effect-asvoid':
    'Avoid Effect.asVoid; return effects whose success type is already void directly.',
  'no-global-json':
    'Avoid global JSON APIs; encode and decode with Effect Schema.',
  'no-in-operator':
    'Avoid object key checks with the in operator; refactor the check away.',
  'no-multiple-function-params':
    'Functions with more than one parameter must accept a single object parameter.',
  'no-nested-effect-array-methods':
    'Avoid nested Effect Array method calls; compose them with pipe to preserve inference.',
  'no-nested-layer-provide':
    'Avoid nested Layer.provide calls; extract the inner layer or use Layer.provideMerge.',
  'no-optional-function-parameters':
    'Avoid optional function parameters; use an explicit union with undefined or null.',
  'no-shadowed-standard-array-static':
    'Require globalThis.Array when Array is imported from effect.',
  'no-silent-error-swallow':
    'Do not silently swallow Effect errors with Effect.void or Effect.unit.',
  'no-static-effect-service-forwarders':
    'Disallow static Effect service method forwarders; acquire the service where its method is used.',
  'no-type-assertion':
    'Avoid TypeScript type assertions; prefer typed construction, validation, or inference.',
  'no-typeof-object':
    'Avoid typeof object checks; prefer Effect Schema or explicit validation helpers.',
  'no-try-catch':
    'Avoid try/catch; use Effect.try, Effect.tryPromise, or explicit error channels.',
  'pipe-max-arguments':
    'Limit pipe calls to 20 arguments; split longer pipelines into named steps.',
  'prefer-effect-match':
    'Use Match from effect for chained literal ternaries over the same value.',
  'prefer-option-from-nullable':
    'Use Option.fromNullable instead of ternaries that choose between Option.some and Option.none.',
  'no-array-filter-map':
    'Avoid adjacent eager filter and map passes; prefer a lazy iterator pipeline or a single pass.',
  'no-known-value-widening':
    'Do not widen a known value into unknown, object, or an open dictionary target.',
  'no-manual-effect-error-tag':
    'Use Effect.catchTag, catchTags, catchReason, or catchReasons instead of branching on _tag inside a broad catch handler.',
  'no-manual-tag-comparison':
    'Use Match or Predicate.isTagged instead of manual _tag comparisons and switches.',
  'no-manual-tagged-construction':
    'Construct tagged values with their Effect constructor instead of literal _tag objects.',
  'no-module-mocking':
    'Avoid Vitest and Jest module mocking; prefer real dependency seams.',
  'no-object-parameters':
    'Do not type function inputs as object; use a precise shape or a generic parameter.',
  'no-reduce-accumulator-copy':
    'Do not copy the accumulator inside a reducer; mutate a fresh, locally owned accumulator.',
  'no-reflect-apply': 'Avoid Reflect.apply; call the typed function directly.',
  'no-reflect-get':
    'Avoid Reflect.get; use typed property access or boundary parsing.',
  'no-service-constructor-imports':
    'Do not import project-local make<Capability> constructors into runtime code; import the owning Layer and yield the service.',
  'no-unknown-parameters':
    'Do not type function inputs as unknown, except the cause convention and the subject of a type predicate.',
  'no-unknown-returns':
    'Do not declare function returns as unknown, Promise<unknown>, or PromiseLike<unknown>.',
  'no-unknown-type-aliases': 'Do not alias unknown in a type alias.',
  'no-unsafe-dictionary-type':
    'Do not base dictionary values on unknown, any, object, or {}.',
  'no-widen-then-assert':
    'Do not widen a known value and later assert it back to a narrower type.',
};

export const oxlintRuleMetadata: ReadonlyArray<OxlintRuleMetadata> = (
  ['core', 'effect', 'anti-slop'] as const
).flatMap((profile) =>
  profileRules[profile].map((name) => ({
    name,
    profile,
    severity: warningRules.has(name) ? ('warn' as const) : ('error' as const),
    description: ruleDescriptions[name] ?? '',
  })),
);

export const severityByRule: Readonly<Record<string, RuleSeverity>> =
  Object.fromEntries(
    oxlintRuleMetadata.map(({ name, severity }) => [name, severity]),
  );

export const rulesByProfile: Readonly<
  Record<RuleProfile, ReadonlyArray<string>>
> = {
  core: oxlintRuleMetadata
    .filter((metadata) => metadata.profile === 'core')
    .map(({ name }) => name),
  effect: oxlintRuleMetadata
    .filter((metadata) => metadata.profile === 'effect')
    .map(({ name }) => name),
  'anti-slop': oxlintRuleMetadata
    .filter((metadata) => metadata.profile === 'anti-slop')
    .map(({ name }) => name),
};
