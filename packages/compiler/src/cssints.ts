/**
 * cssints - CSS-in-TS compile-time utilities
 * 
 * This is the entry point for the cssints module.
 * Functions in this module can be used with compile-time evaluation:
 * 
 *   import * as css from "cssints" with { type: "cssints" };
 *   css.display("flex") // → "x1234abcd" at compile time
 */

export * from "./cssints/index";
