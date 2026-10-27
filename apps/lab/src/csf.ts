import type { JSX } from "@solidjs/web";

/**
 * The part of CSF 3 this lab reads: a default `meta` export (title and component) and one object per named export for a
 * story. Storybook 11 keeps CSF 3 support — its CSF Next factories (`preview.meta`, `meta.story`) come from the framework
 * package and only mean something inside a Storybook — so a story file here moves into a real Storybook unchanged; the
 * entries this loader builds are the same `title`/id/args Storybook builds.
 */
export interface Meta<Props extends object = Record<string, unknown>> {
  readonly title: string;
  readonly component?: (props: Props) => JSX.Element;
  /** Arguments every story of the file starts from. */
  readonly args?: Partial<Props>;
}

export interface Story<Props extends object = Record<string, unknown>> {
  /** The name in the rail, instead of the export's own. */
  readonly name?: string;
  /** Arguments this story adds to the meta's. */
  readonly args?: Partial<Props>;
  /** Markup instead of the meta's component: a story that composes several widgets. */
  readonly render?: (args: Props) => JSX.Element;
}
