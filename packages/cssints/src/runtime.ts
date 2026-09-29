// The only code that ships to the browser. No imports: plain, dependency-free, no Effect.
export type ClassValue = string | false | null | undefined | 0 | ClassValue[];

export const cx = (...a: ClassValue[]): string => a.flat(Infinity).filter(Boolean).join(" ");

export interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string>;
}

export function _cv(config: CvRuntimeConfig): (props?: Record<string, string | undefined>) => string {
  return (props = {}) => {
    const classes = [config.base];
    for (const [name, value] of Object.entries(props)) {
      const v = value || config.defaultVariants?.[name];
      if (v && config.variants[name]?.[v]) classes.push(config.variants[name][v]);
    }
    for (const [name, v] of Object.entries(config.defaultVariants ?? {}))
      if (!props[name] && config.variants[name]?.[v]) classes.push(config.variants[name][v]);
    return classes.filter(Boolean).join(" ");
  };
}
