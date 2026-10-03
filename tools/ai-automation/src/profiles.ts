import {
  type RuleProfile,
  oxlintRuleMetadata,
  rulesByProfile,
  severityByRule,
} from './catalog.ts';

type Severity = 'error' | 'warn';

export const profile = (
  name: RuleProfile,
  namespace = 'automation',
): Readonly<Record<string, Severity>> =>
  Object.fromEntries(
    rulesByProfile[name].map((ruleName) => [
      `${namespace}/${ruleName}`,
      severityByRule[ruleName] ?? 'error',
    ]),
  );

export const profiles = Object.freeze({
  core: profile('core'),
  effect: profile('effect'),
  'anti-slop': profile('anti-slop'),
});

export const allRules = Object.freeze(
  Object.fromEntries(
    oxlintRuleMetadata.map(({ name, severity }) => [
      `automation/${name}`,
      severity,
    ]),
  ),
);
