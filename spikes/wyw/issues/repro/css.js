// Runtime of the tag, used when wyw evaluates hoisted arguments.
export const css = new Proxy({}, { get: (_, name) => () => `eval:${String(name)}` });
