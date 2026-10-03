import { describe, expect, it } from 'vite-plus/test';
import path from 'node:path';
import { profiles } from '../../../src/profiles.ts';
import { readFileSync } from 'node:fs';

const configPath = path.join(
  import.meta.dirname,
  '..',
  'diff-check.oxlintrc.json',
);

const readConfig = (): {
  readonly jsPlugins: ReadonlyArray<string>;
  readonly rules: Readonly<Record<string, string>>;
} => JSON.parse(readFileSync(configPath, 'utf8'));

describe('diff-check anti-slop wiring', () => {
  it('loads the automation plugin', () => {
    expect(readConfig().jsPlugins).toContain('../../src/plugin.ts');
  });

  it('enables exactly the anti-slop profile', () => {
    const enabled = Object.keys(readConfig().rules)
      .filter((rule) => rule.startsWith('automation/'))
      .toSorted();

    expect(enabled).toEqual(Object.keys(profiles['anti-slop']).toSorted());
  });
});
