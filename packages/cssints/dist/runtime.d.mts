//#region src/runtime.d.ts
export type ClassValue = string | false | null | undefined | 0 | ClassValue[];
export declare const cx: (...a: ClassValue[]) => string;
export interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string | boolean>;
  /** The base classes a variant value replaces (it sets the same property): dropped while that value is active. */
  drops?: Record<string, Record<string, string>>;
  /** Added when every variant in `when` has that value; `drops` are the base and variant classes it replaces. */
  compound?: {
    when: Record<string, string>;
    class: string;
    drops?: string;
  }[];
}
export declare function _cv(config: CvRuntimeConfig): (props?: Record<string, string | boolean | undefined>) => string;
//#endregion