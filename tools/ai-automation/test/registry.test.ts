import * as ts from 'typescript';
import { describe, expect, it } from 'vite-plus/test';
import path from 'node:path';
import plugin from '../src/plugin.ts';
import { readFileSync } from 'node:fs';

const testedRuleNames = (): ReadonlyArray<string> => {
  const testPath = path.join(import.meta.dirname, 'rules.test.ts');
  const sourceFile = ts.createSourceFile(
    testPath,
    readFileSync(testPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const names: Array<string> = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(sourceFile) === 'tester' &&
      node.expression.name.text === 'run'
    ) {
      const name = node.arguments[0];
      if (name !== undefined && ts.isStringLiteral(name)) {
        names.push(name.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return names.toSorted();
};

describe('OXLint registry', () => {
  it('has a behavioral test block for every registered rule', () => {
    expect(testedRuleNames()).toEqual(Object.keys(plugin.rules).toSorted());
  });
});
