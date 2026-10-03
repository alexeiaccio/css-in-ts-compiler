import { noArrayFilterMapRule } from '../vendor/anti-slop/rules/no-array-filter-map.ts';
import noBannedTypeAssertions from './rules/no-banned-type-assertions.ts';
import noCascadingLayerProvide from './rules/no-cascading-layer-provide.ts';
import noEffectAsvoid from './rules/no-effect-asvoid.ts';
import noGlobalJson from './rules/no-global-json.ts';
import noInOperator from './rules/no-in-operator.ts';
import { noKnownValueWideningRule } from '../vendor/anti-slop/rules/no-known-value-widening.ts';
import { noManualEffectErrorTagRule } from '../vendor/anti-slop/effect/rules/no-manual-effect-error-tag.ts';
import { noManualTagComparisonRule } from '../vendor/anti-slop/effect/rules/no-manual-tag-comparison.ts';
import { noManualTaggedConstructionRule } from '../vendor/anti-slop/effect/rules/no-manual-tagged-construction.ts';
import { noModuleMockingRule } from '../vendor/anti-slop/rules/no-module-mocking.ts';
import noMultipleFunctionParams from './rules/no-multiple-function-params.ts';
import noNestedEffectArrayMethods from './rules/no-nested-effect-array-methods.ts';
import noNestedLayerProvide from './rules/no-nested-layer-provide.ts';
import { noObjectParametersRule } from '../vendor/anti-slop/rules/no-object-parameters.ts';
import noOptionalFunctionParameters from './rules/no-optional-function-parameters.ts';
import { noReduceAccumulatorCopyRule } from '../vendor/anti-slop/rules/no-reduce-accumulator-copy.ts';
import { noReflectApplyRule } from '../vendor/anti-slop/rules/no-reflect-apply.ts';
import { noReflectGetRule } from '../vendor/anti-slop/rules/no-reflect-get.ts';
import { noServiceConstructorImportsRule } from '../vendor/anti-slop/effect/rules/no-service-constructor-imports.ts';
import noShadowedStandardArrayStatic from './rules/no-shadowed-standard-array-static.ts';
import noSilentErrorSwallow from './rules/no-silent-error-swallow.ts';
import noStaticEffectServiceForwarders from './rules/no-static-effect-service-forwarders.ts';
import noTryCatch from './rules/no-try-catch.ts';
import noTypeAssertion from './rules/no-type-assertion.ts';
import noTypeofObject from './rules/no-typeof-object.ts';
import { noUnknownParametersRule } from '../vendor/anti-slop/rules/no-unknown-parameters.ts';
import { noUnknownReturnsRule } from '../vendor/anti-slop/rules/no-unknown-returns.ts';
import { noUnknownTypeAliasesRule } from '../vendor/anti-slop/rules/no-unknown-type-aliases.ts';
import { noUnsafeDictionaryTypeRule } from '../vendor/anti-slop/rules/no-unsafe-dictionary-type.ts';
import { noWidenThenAssertRule } from '../vendor/anti-slop/rules/no-widen-then-assert.ts';
import pipeMaxArguments from './rules/pipe-max-arguments.ts';
import preferEffectMatch from './rules/prefer-effect-match.ts';
import preferOptionFromNullable from './rules/prefer-option-from-nullable.ts';

// `@oxlint/plugins` and `oxlint/plugins-dev` ship distinct, structurally
// similar `Rule` types. The plugin registry only needs the common surface, so
// it uses a local structural type instead of picking one library's `Rule`.
type PluginRule = {
  readonly meta?: unknown;
  readonly create?: unknown;
  readonly createOnce?: unknown;
};

interface Plugin {
  readonly meta: {
    readonly name: string;
  };
  readonly rules: Readonly<Record<string, PluginRule>>;
}

const plugin: Plugin = {
  meta: {
    name: 'automation',
  },
  rules: {
    'no-array-filter-map': noArrayFilterMapRule,
    'no-banned-type-assertions': noBannedTypeAssertions,
    'no-cascading-layer-provide': noCascadingLayerProvide,
    'no-effect-asvoid': noEffectAsvoid,
    'no-global-json': noGlobalJson,
    'no-in-operator': noInOperator,
    'no-known-value-widening': noKnownValueWideningRule,
    'no-manual-effect-error-tag': noManualEffectErrorTagRule,
    'no-manual-tag-comparison': noManualTagComparisonRule,
    'no-manual-tagged-construction': noManualTaggedConstructionRule,
    'no-module-mocking': noModuleMockingRule,
    'no-multiple-function-params': noMultipleFunctionParams,
    'no-nested-effect-array-methods': noNestedEffectArrayMethods,
    'no-nested-layer-provide': noNestedLayerProvide,
    'no-object-parameters': noObjectParametersRule,
    'no-optional-function-parameters': noOptionalFunctionParameters,
    'no-reduce-accumulator-copy': noReduceAccumulatorCopyRule,
    'no-reflect-apply': noReflectApplyRule,
    'no-reflect-get': noReflectGetRule,
    'no-service-constructor-imports': noServiceConstructorImportsRule,
    'no-shadowed-standard-array-static': noShadowedStandardArrayStatic,
    'no-silent-error-swallow': noSilentErrorSwallow,
    'no-static-effect-service-forwarders': noStaticEffectServiceForwarders,
    'no-try-catch': noTryCatch,
    'no-type-assertion': noTypeAssertion,
    'no-typeof-object': noTypeofObject,
    'no-unknown-parameters': noUnknownParametersRule,
    'no-unknown-returns': noUnknownReturnsRule,
    'no-unknown-type-aliases': noUnknownTypeAliasesRule,
    'no-unsafe-dictionary-type': noUnsafeDictionaryTypeRule,
    'no-widen-then-assert': noWidenThenAssertRule,
    'pipe-max-arguments': pipeMaxArguments,
    'prefer-effect-match': preferEffectMatch,
    'prefer-option-from-nullable': preferOptionFromNullable,
  },
};

export default plugin;
