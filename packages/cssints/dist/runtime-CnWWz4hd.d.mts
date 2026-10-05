//#region src/runtime.d.ts
type ClassValue = string | false | null | undefined | 0 | ClassValue[];
declare const cx: (...a: ClassValue[]) => string;
interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string>;
  /** The base classes a variant value replaces (it sets the same property): dropped while that value is active. */
  drops?: Record<string, Record<string, string>>;
}
declare function _cv(config: CvRuntimeConfig): (props?: Record<string, string | undefined>) => string;
//#endregion
export { cx as i, CvRuntimeConfig as n, _cv as r, ClassValue as t };