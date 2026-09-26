const { join } = require("node:path");

const { BaseProcessor } = require("@wyw-in-js/processor-utils");
const { ValueType } = require("@wyw-in-js/shared");

const { classOf, toDecls } = require("./lib.mjs");

const PREEVAL = join(__dirname, "preeval.mjs");
const LAYER = "_.a"; // ponytail: default layer only; conditions (_.b.._.e) come with media/hover
const log = (...a) => console.error("[processor]", ...a);

// css.p(4) | css.flex().items("c") | css.flex.items("c") | ns.p(4) (namespace import: callee is `ns.p` itself)
function toSteps(params) {
  const steps = [];
  for (const [kind, ...rest] of params) {
    if (kind === "callee" && rest[0].type === "MemberExpression") steps.push({ member: rest[0].property.name, args: [] });
    else if (kind === "member") steps.push({ member: rest[0], args: [] });
    else if (kind === "call" && steps.length) steps.at(-1).args.push(...rest);
  }
  return steps;
}

class CssintsProcessor extends BaseProcessor {
  constructor(params, ...rest) {
    super([params[0]], ...rest);
    this.steps = toSteps(params);
    if (!this.steps.length || !params.some((p) => p[0] === "call")) throw BaseProcessor.SKIP;
    log("steps", this.steps.map((s) => `${s.member}(${s.args.map((e) => (e.kind === ValueType.CONST ? JSON.stringify(e.value) : `<${e.source}>`)).join(", ")})`).join("."));
    for (const s of this.steps) for (const e of s.args) if (e.kind !== ValueType.CONST) this.dependencies.push(e);
    this.classes = [];
  }

  get asSelector() {
    return `.${this.className}`;
  }

  get value() {
    return this.astService.stringLiteral(this.classes.join(" "));
  }

  // Same as dx-styles createPreevalArgumentNode: lazy args are hoisted thunks.
  argNode(e) {
    return e.kind === ValueType.CONST ? e.ex : this.astService.callExpression(e.ex, []);
  }

  build(values) {
    const resolve = (e) => (e.kind === ValueType.CONST ? e.value : values.get(e.ex.name));
    const decls = this.steps.flatMap((s) => toDecls(s.member, s.args.map(resolve)));
    log("build", this.steps.map((s) => `${s.member}${JSON.stringify(s.args.map(resolve))}`).join("."), "->", JSON.stringify(decls));
    const rules = {};
    for (const d of decls) {
      const cls = classOf(d);
      if (!this.classes.includes(cls)) this.classes.push(cls);
      rules[`.${cls}`] = { className: cls, cssText: `@layer ${LAYER}{${d[0]}:${d[1]};}`, displayName: this.displayName, start: this.location?.start ?? null };
    }
    this.artifacts.push(["css", [rules, []]]);
  }

  doEvaltimeReplacement() {
    const a = this.astService;
    const steps = this.steps.map((s) => a.arrayExpression([a.stringLiteral(s.member), a.arrayExpression(s.args.map((e) => this.argNode(e)))]));
    this.replacer(a.callExpression(a.addNamedImport("preeval", PREEVAL), steps), false);
  }

  doRuntimeReplacement() {
    this.replacer(this.value, false);
  }
}

module.exports = { default: CssintsProcessor };
