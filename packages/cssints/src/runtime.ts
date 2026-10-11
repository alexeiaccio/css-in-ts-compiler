// The only code that ships to the browser. No imports: plain, dependency-free, no Effect.
export type ClassValue = string | false | null | undefined | 0 | ClassValue[];

// What the plugin puts in place of a `cn(...)` with runtime arguments (user code never names it): the classes joined,
// without those that an active class `drops` (it sets the same property under the same conditions, and comes later).
export function _cx(drops: [string, string][], ...a: ClassValue[]): string {
  const on = (a as unknown[]).flat(Infinity).filter(Boolean).join(" ").split(" ");
  const gone = drops.flatMap(([by, c]) => (on.includes(by) ? c.split(" ") : []));
  return on.filter((c) => c && !gone.includes(c)).join(" ");
}

export interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string | boolean>;
  /** The base classes a variant value replaces (it sets the same property): dropped while that value is active. */
  drops?: Record<string, Record<string, string>>;
  /** Added when every variant in `when` has that value; `drops` are the base and variant classes it replaces. */
  compound?: { when: Record<string, string>; class: string; drops?: string }[];
}

// What the plugin puts in place of a `cv({...})` site (user code never names it).
export function _cv(
  config: CvRuntimeConfig,
): (props?: Record<string, string | boolean | undefined>) => string {
  return (props = {}) => {
    const out = [config.base];
    const gone: string[] = [];
    const val: Record<string, string> = {};
    const take = (c?: string, d?: string) => {
      if (c) out.push(c);
      if (c && d) gone.push(...d.split(" "));
    };
    for (const name in config.variants) {
      const v = (val[name] = String(props[name] ?? config.defaultVariants[name]));
      take(config.variants[name]![v], config.drops?.[name]?.[v]);
    }
    for (const m of config.compound ?? [])
      if (Object.keys(m.when).every((k) => val[k] === m.when[k])) take(m.class, m.drops);
    return out
      .join(" ")
      .split(" ")
      .filter((c) => c && !gone.includes(c))
      .join(" ");
  };
}
