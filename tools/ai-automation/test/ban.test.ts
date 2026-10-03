import {
  banCallOf,
  banCallOfMember,
  banImport,
  banMember,
  banMultiple,
  banNewExpr,
  banStatement,
} from '../src/rules/ban.ts';
import { describe, it } from 'vite-plus/test';
import { RuleTester } from 'oxlint/plugins-dev';
import { asTestableRule } from '../src/oxlint-rule-bridge.ts';

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

const options = (message: string) => ({ message, description: 'test rule' });

tester.run(
  'ban-statement',
  asTestableRule(
    banStatement('TryStatement', options('Do not use try/catch.')),
  ),
  {
    valid: ['const value = 1;'],
    invalid: [
      {
        code: 'try { run(); } catch { fallback(); }',
        errors: [/Do not use try\/catch/],
      },
    ],
  },
);

tester.run(
  'ban-member-any-property',
  asTestableRule(banMember({ object: 'JSON' }, options('Do not use JSON.'))),
  {
    valid: ['const value = codec.JSON.stringify(input);'],
    invalid: [
      { code: 'JSON.parse(input);', errors: [/Do not use JSON/] },
      { code: 'JSON.stringify(input);', errors: [/Do not use JSON/] },
    ],
  },
);

tester.run(
  'ban-member-chained-path',
  asTestableRule(
    banMember({ object: ['globalThis', 'JSON'] }, options('Do not use JSON.')),
  ),
  {
    valid: ['const value = JSON.parse(input);'],
    invalid: [
      { code: 'globalThis.JSON.parse(input);', errors: [/Do not use JSON/] },
    ],
  },
);

tester.run(
  'ban-member-computed-property',
  asTestableRule(
    banMember(
      { object: 'Reflect', property: 'get' },
      options('Avoid Reflect.get.'),
    ),
  ),
  {
    valid: ['Reflect.set(owner, key, value);'],
    invalid: [
      { code: 'Reflect.get(owner, key);', errors: [/Avoid Reflect\.get/] },
      { code: "Reflect['get'](owner, key);", errors: [/Avoid Reflect\.get/] },
    ],
  },
);

tester.run(
  'ban-call-of-member',
  asTestableRule(
    banCallOfMember(
      { object: 'console', property: ['log', 'error'] },
      options('Use Effect.log.'),
    ),
  ),
  {
    valid: ['logger.log(value);'],
    invalid: [
      { code: 'console.log(value);', errors: [/Use Effect\.log/] },
      { code: 'console.error(value);', errors: [/Use Effect\.log/] },
    ],
  },
);

tester.run(
  'ban-call-of',
  asTestableRule(banCallOf('fetch', options('Use the Effect HTTP client.'))),
  {
    valid: ['client.fetch(url);'],
    invalid: [{ code: 'fetch(url);', errors: [/Use the Effect HTTP client/] }],
  },
);

tester.run(
  'ban-new-expr',
  asTestableRule(banNewExpr('Date', options('Use Clock.'))),
  {
    valid: ['Date.now();'],
    invalid: [{ code: 'new Date();', errors: [/Use Clock/] }],
  },
);

tester.run(
  'ban-import',
  asTestableRule(banImport('node:fs', options('Use FileSystem.'))),
  {
    valid: ["import fs from 'node:fs/promises';"],
    invalid: [
      { code: "import fs from 'node:fs';", errors: [/Use FileSystem/] },
    ],
  },
);

tester.run(
  'ban-import-predicate',
  asTestableRule(
    banImport((source) => source.startsWith('node:'), options('Use Effect.')),
  ),
  {
    valid: ["import { Effect } from 'effect';"],
    invalid: [{ code: "import os from 'node:os';", errors: [/Use Effect/] }],
  },
);

tester.run(
  'ban-multiple',
  asTestableRule(
    banMultiple(
      {
        statements: ['TryStatement'],
        members: [{ object: 'JSON' }],
      },
      options('Banned pattern.'),
    ),
  ),
  {
    valid: ['const value = 1;'],
    invalid: [
      {
        code: 'try { run(); } catch { fallback(); }',
        errors: [/Banned pattern/],
      },
      { code: 'JSON.stringify(value);', errors: [/Banned pattern/] },
    ],
  },
);
