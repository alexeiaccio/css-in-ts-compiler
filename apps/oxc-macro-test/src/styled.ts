import type { MacroResult } from "oxc-macro";

export function styled(opts: Record<string, string>): MacroResult {
  const rules = Object.entries(opts)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

  const className = `s${Buffer.from(rules).toString("base64url").slice(0, 8)}`;

  return {
    value: className,
    assets: [
      {
        type: "css",
        content: `.${className}{${rules}}`,
        name: `${className}.css`,
      },
    ],
  };
}
