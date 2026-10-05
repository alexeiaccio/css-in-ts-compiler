import { createTokens } from "cssints";
import { scope } from "cssints/plugin";
import { plugin as ringScope } from "./examples/ring.ts";

const theme = createTokens({ color: { accent: { $value: "#0af", $type: "color" } }, space: { md: { $value: "8px", $type: "dimension" } } });

const x = scope("x", {
    ring: ringScope,                                     // a scope as a module: <ring.width>
    brand: { tokens: theme },                            // a token set as a module: <brand.color.accent>, <brand.space.md>
    "#tone": "<brand.color.accent> | <color>",           // private alias over a token path
    "-webkit-font-smoothing": "auto | none | antialiased",
    core: { css: "& { color: var(--_c) }" },
    tint: { args: "<color> <percentage>", value: ([c, p]) => `color-mix(in oklab, ${c}, black ${p})` },
    badge: {
      uses: ["core"],
      chain: {
        tone: { args: "<tone>", emit: (v) => [["--_c", v]] },
        gap: { args: "<ring.width>", spacing: true, emit: (v) => [["gap", v]] },
        plain: { args: "", excludes: ["tone"], emit: () => [] },
      },
    },
    pick: { args: { "size?": "<ring.width>", on: "<tone>" }, uses: ["core"] },
}).build({ pick: ({ size, on }) => ({ decls: [["--_c", on], ["--_s", size ?? "0"]] }) });
export const { badge, webkitFontSmoothing, tint, pick, ring } = x.export();

export const a: string = badge().tone("red").gap(2);
export const b: string = badge().tone("#0af");
export const c: string = webkitFontSmoothing("antialiased");
export const d = tint("red", "10%");
export const e: string = pick({ on: "red", size: "thin" });
export const f: string = ring.ring().color("red");
// @ts-expect-error not a tone
badge().tone("1px");
// @ts-expect-error tone and plain exclude each other
badge().plain().tone("red");
// @ts-expect-error not a width (ring's alias, qualified)
badge().gap("red");
// @ts-expect-error not an antialiasing
webkitFontSmoothing("sharp");
// @ts-expect-error size is thin or a length
pick({ on: "red", size: "huge" });
// @ts-expect-error a missing required argument
pick({ size: "thin" });

// @ts-expect-error `uses` names something that is not a kernel, global, runtime or conflicts
scope("bad", { a: { chain: {}, uses: ["nope"] } });
// @ts-expect-error a private entry (#core) of an embedded scope cannot be used
scope("bad2", { ring: ringScope, a: { chain: {}, uses: ["ring.core"] } });
// @ts-expect-error a scope with call members has no export() until build()
scope("bad3", { a: { args: "<color>" } }).export();
// @ts-expect-error private entries are not exported
x.export().core;
