import type { JSX } from "@solidjs/web";

/** A control a story declares for one of its args: only what is declared gets a row in the panel. */
export type Control =
  | { readonly type: "boolean" }
  | { readonly type: "select"; readonly options: ReadonlyArray<string> }
  | { readonly type: "text" }
  | {
      readonly type: "number";
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
    }
  | { readonly type: "range"; readonly min: number; readonly max: number; readonly step?: number };

export type ArgTypes = Readonly<Record<string, Control>>;

/**
 * The part of CSF 3 this site reads: a default `meta` export (title, component, args, argTypes) and one object per named
 * export for a story. Storybook 11 keeps CSF 3 support, so a story file here moves into a real Storybook unchanged; the ids
 * this loader builds are the ones Storybook builds (`button--primary`).
 *
 * `argTypes` is the one extension: Storybook infers a control from the component's props, which a Solid component does not
 * carry at run time, so a story declares the controls it wants by hand.
 */
export interface Meta<Props extends object = Record<string, unknown>> {
  readonly title: string;
  readonly component?: (props: Props) => JSX.Element;
  /** Arguments every story of the file starts from. */
  readonly args?: Partial<Props>;
  readonly argTypes?: ArgTypes;
}

export interface Story<Props extends object = Record<string, unknown>> {
  /** The name in the rail, instead of the export's own. */
  readonly name?: string;
  /** Arguments this story adds to the meta's. */
  readonly args?: Partial<Props>;
  /** Markup instead of the meta's component: a story that composes several widgets. */
  readonly render?: (args: Props) => JSX.Element;
}
