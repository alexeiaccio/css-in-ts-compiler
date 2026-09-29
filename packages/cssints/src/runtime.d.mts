export type ClassValue = string | false | null | undefined | 0 | ClassValue[];

export function cx(...classes: ClassValue[]): string;

export interface CvRuntimeConfig {
  base: string;
  variants: Record<string, Record<string, string>>;
  defaultVariants: Record<string, string>;
}

export function _cv(config: CvRuntimeConfig): (props?: Record<string, string | undefined>) => string;
