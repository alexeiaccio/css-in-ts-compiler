// The only code that ships to the browser. No imports: plain, dependency-free, no Effect.
export type ClassValue = string | false | null | undefined | 0 | ClassValue[];

export const cx = (...a: ClassValue[]): string =>
  (a as unknown[]).flat(Infinity).filter(Boolean).join(" ");

export interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string>;
  /** The base classes a variant value replaces (it sets the same property): dropped while that value is active. */
  drops?: Record<string, Record<string, string>>;
}

export function _cv(
  config: CvRuntimeConfig,
): (props?: Record<string, string | undefined>) => string {
  return (props = {}) => {
    const classes = [config.base];
    const gone: string[] = [];
    const use = (name: string, v: string | undefined) => {
      if (!v || !config.variants[name]?.[v]) return;
      classes.push(config.variants[name][v]);
      const d = config.drops?.[name]?.[v];
      if (d) gone.push(...d.split(" "));
    };
    for (const [name, value] of Object.entries(props))
      use(name, value || config.defaultVariants?.[name]);
    for (const [name, v] of Object.entries(config.defaultVariants ?? {}))
      if (!props[name]) use(name, v);
    if (gone.length)
      classes[0] = config.base
        .split(" ")
        .filter((c) => !gone.includes(c))
        .join(" ");
    return classes.filter(Boolean).join(" ");
  };
}
