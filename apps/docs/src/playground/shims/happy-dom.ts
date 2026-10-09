// happy-dom for evaluate.ts, which builds a DOM for Node's evaluator (DomEvaluator): the playground has its own evaluator
// and never makes one. The worker has no DOM, so a module that touches `document` at build time fails with a located error.
export class Window {}
