import { parseSync, Visitor } from 'oxc-parser';

const code = `const container = style('container', { display: 'flex' });`;

const result = parseSync('test.ts', code, {
  lang: 'ts',
  sourceType: 'module',
  astType: 'ts',
  range: true,
});

const visitor = {
  CallExpression(node) {
    console.log('Found CallExpression:', JSON.stringify({
      callee: node.callee,
      args: node.arguments.length
    }, null, 2));
  }
};

const extractor = new Visitor(visitor);
extractor.visit(result.program);
