//#region src/frame.d.ts
/**
 * `frame().radius(t.radius.lg).padding(4).border("1px").margin(2)`: a box whose radius follows from the frames around it
 * (`radius` is the radius of the outermost frame; inside, it is the parent's inner radius less the margin). `padding` and
 * `margin` take a step of the spacing scale; each method once. It stands for `padding`, `margin`, `border-radius` and the
 * border widths and styles, so mixing it with them in one `cn()` is a build error (border colours are fine).
 */
export declare const frameScope: import("cssints/plugin").Scope<"frame", {
  readonly core: {
    readonly css: string;
    readonly atProperty: string;
    readonly requires: ["css.at-rules.property", "css.types.max"];
  };
  readonly fallback: {
    readonly polyfills: ["css.at-rules.container.style_queries_for_custom_properties"];
    readonly parentVars: [{
      readonly marker: "&";
      readonly read: "--_i";
      readonly write: "--_u";
      readonly watch: "--_t";
    }];
    readonly css: "\n:root[data-cssints-poly] & {\n  --_u: calc(var(--_r) + var(--_m));\n  --_i: max(max(var(--_u) - var(--_m), 0px) - var(--_p) - var(--_b), 0px);\n  --_t: var(--_i);\n  border-radius: max(var(--_u) - var(--_m), 0px);\n  transition: --_t 1ms;\n}";
  };
  readonly noBox: {
    readonly props: [RegExp, RegExp];
    readonly message: "frame() sets padding, margin, border-radius and the border: use its methods";
  };
  readonly frame: {
    readonly uses: readonly ["core", "fallback", "noBox"];
    readonly chain: {
      readonly radius: {
        readonly args: "<length [0,∞]>";
        readonly emit: (v: string) => [string, string][];
      };
      readonly padding: {
        readonly args: "<length [0,∞]>";
        readonly spacing: true;
        readonly emit: (v: string) => [string, string][];
      };
      readonly border: {
        readonly args: "<length [0,∞]>";
        readonly emit: (v: string) => [string, string][];
      };
      readonly margin: {
        readonly args: "<length>";
        readonly spacing: true;
        readonly emit: (v: string) => [string, string][];
      };
    };
  };
}>;
export declare const frame: () => import("cssints/plugin").Chain<"frame", {
  readonly radius: {
    readonly args: "<length [0,∞]>";
    readonly emit: (v: string) => [string, string][];
  };
  readonly padding: {
    readonly args: "<length [0,∞]>";
    readonly spacing: true;
    readonly emit: (v: string) => [string, string][];
  };
  readonly border: {
    readonly args: "<length [0,∞]>";
    readonly emit: (v: string) => [string, string][];
  };
  readonly margin: {
    readonly args: "<length>";
    readonly spacing: true;
    readonly emit: (v: string) => [string, string][];
  };
}, {}>;
//#endregion