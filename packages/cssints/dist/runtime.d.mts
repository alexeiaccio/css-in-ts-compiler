//#region src/runtime.d.ts
export type ClassValue = string | false | null | undefined | 0 | ClassValue[];
export declare const cx: (...a: ClassValue[]) => string;
export interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string>;
  /** The base classes a variant value replaces (it sets the same property): dropped while that value is active. */
  drops?: Record<string, Record<string, string>>;
}
export declare function _cv(config: CvRuntimeConfig): (props?: Record<string, string | undefined>) => string;
//#endregion