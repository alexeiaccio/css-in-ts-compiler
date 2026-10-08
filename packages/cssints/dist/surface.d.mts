import { t as AliasesOf } from "./scope-CadMZW27.mjs";
//#region src/surface.d.ts
/**
 * `surface().color(t.color.canvas).lighten(0.06).ink()`: a background that follows from the surface around it, however
 * many plain wrappers sit between. `color(<color>)` is an absolute base (default: the parent surface); `lighten(step)`,
 * `darken(step)` and `contrast(step)` (away from the parent: a light parent is darkened, a dark one lightened) move its
 * OKLCH lightness by `step` in [0, 1], and only one of them goes in a chain. `ink()` is black or white text by the
 * lightness of the surface. These are tonal steps, not a contrast guarantee: for a ratio, check declared tokens with
 * `css.check.contrast`. It stands for `background-color`, so mixing it with `bg()`, `background` or `backgroundColor` in
 * one `cn()` is a build error.
 */
export declare const surfaceScope: import("cssints/plugin").Scope<"surface", {
  readonly frame: import("cssints/plugin").Scope<"frame", {
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
  readonly core: {
    readonly css: string;
    readonly atProperty: string;
    readonly requires: ["css.at-rules.property", {
      readonly key: "css.types.color.oklch.relative_syntax";
      readonly exact: true;
    }];
  };
  readonly fallback: {
    readonly polyfills: ["css.at-rules.container.style_queries_for_custom_properties"];
    readonly parentVars: [{
      readonly marker: "&";
      readonly read: "--_v";
      readonly write: "--_u";
      readonly watch: "--_t";
    }];
    readonly css: string;
  };
  readonly noBackground: {
    readonly props: ["background", "background-color"];
    readonly message: "surface() sets the background colour: use its methods";
  };
  readonly surface: {
    readonly uses: readonly ["core", "fallback", "noBackground"];
    readonly chain: {
      readonly color: {
        readonly args: "<color>";
        readonly emit: (v: string) => [string, string][];
      };
      readonly lighten: {
        readonly args: "<number [0,1]>";
        readonly excludes: readonly ["darken", "contrast"];
        readonly emit: (v: string) => [string, string][];
      };
      readonly darken: {
        readonly args: "<number [0,1]>";
        readonly excludes: readonly ["lighten", "contrast"];
        readonly emit: (v: string) => [string, string][];
      };
      readonly contrast: {
        readonly args: "<number [0,1]>";
        readonly excludes: readonly ["lighten", "darken"];
        readonly emit: (v: string) => [string, string][];
      };
      readonly ink: {
        readonly args: "";
        readonly emit: () => [string, string][];
      };
    };
  };
}>;
export declare const surface: () => import("cssints/plugin").Chain<"surface", {
  readonly color: {
    readonly args: "<color>";
    readonly emit: (v: string) => [string, string][];
  };
  readonly lighten: {
    readonly args: "<number [0,1]>";
    readonly excludes: readonly ["darken", "contrast"];
    readonly emit: (v: string) => [string, string][];
  };
  readonly darken: {
    readonly args: "<number [0,1]>";
    readonly excludes: readonly ["lighten", "contrast"];
    readonly emit: (v: string) => [string, string][];
  };
  readonly contrast: {
    readonly args: "<number [0,1]>";
    readonly excludes: readonly ["lighten", "darken"];
    readonly emit: (v: string) => [string, string][];
  };
  readonly ink: {
    readonly args: "";
    readonly emit: () => [string, string][];
  };
}, AliasesOf<{
  readonly frame: import("cssints/plugin").Scope<"frame", {
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
  readonly core: {
    readonly css: string;
    readonly atProperty: string;
    readonly requires: ["css.at-rules.property", {
      readonly key: "css.types.color.oklch.relative_syntax";
      readonly exact: true;
    }];
  };
  readonly fallback: {
    readonly polyfills: ["css.at-rules.container.style_queries_for_custom_properties"];
    readonly parentVars: [{
      readonly marker: "&";
      readonly read: "--_v";
      readonly write: "--_u";
      readonly watch: "--_t";
    }];
    readonly css: string;
  };
  readonly noBackground: {
    readonly props: ["background", "background-color"];
    readonly message: "surface() sets the background colour: use its methods";
  };
  readonly surface: {
    readonly uses: readonly ["core", "fallback", "noBackground"];
    readonly chain: {
      readonly color: {
        readonly args: "<color>";
        readonly emit: (v: string) => [string, string][];
      };
      readonly lighten: {
        readonly args: "<number [0,1]>";
        readonly excludes: readonly ["darken", "contrast"];
        readonly emit: (v: string) => [string, string][];
      };
      readonly darken: {
        readonly args: "<number [0,1]>";
        readonly excludes: readonly ["lighten", "contrast"];
        readonly emit: (v: string) => [string, string][];
      };
      readonly contrast: {
        readonly args: "<number [0,1]>";
        readonly excludes: readonly ["lighten", "darken"];
        readonly emit: (v: string) => [string, string][];
      };
      readonly ink: {
        readonly args: "";
        readonly emit: () => [string, string][];
      };
    };
  };
}>>;
//#endregion