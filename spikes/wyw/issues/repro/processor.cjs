const { BaseProcessor } = require("@wyw-in-js/processor-utils");
const { ValueType } = require("@wyw-in-js/shared");

// css.name(...args). Eval-time value is "eval:name"; runtime value is "name(args)" once built, else the class name.
class Processor extends BaseProcessor {
  constructor(params, ...rest) {
    super([params[0]], ...rest);
    const call = params.find((p) => p[0] === "call");
    if (!call) throw BaseProcessor.SKIP;
    this.name = params.find((p) => p[0] === "member")?.[1] ?? params[0][1].property?.name;
    this.args = call.slice(1);
    this.dependencies.push(...this.args.filter((a) => a.kind !== ValueType.CONST));
    console.log(`params ${this.name}(${this.args.map((a) => a.source).join(", ")})`);
  }

  get asSelector() {
    return `.${this.className}`;
  }

  get value() {
    return this.astService.stringLiteral(this.built ?? this.className);
  }

  build(values) {
    const args = this.args.map((a) => (a.kind === ValueType.CONST ? a.value : values.get(a.ex.name)));
    this.built = `${this.name}(${args.map((v) => JSON.stringify(v)).join(", ")})`;
    console.log(`build  ${this.built}`);
    const rule = { className: this.className, cssText: "--x:1", displayName: this.displayName, start: this.location?.start };
    this.artifacts.push(["css", [{ [this.asSelector]: rule }, []]]);
  }

  doEvaltimeReplacement() {
    this.replacer(this.astService.stringLiteral(`eval:${this.name}`), false);
  }

  doRuntimeReplacement() {
    this.replacer(this.value, false);
  }
}

module.exports = { default: Processor };
