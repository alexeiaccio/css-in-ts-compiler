/**
 * @cssints/types
 *
 * CSS type definitions for the cssints compiler.
 * Extends csstype with CSS functions from MDN Browser Compatibility Data.
 *
 * Usage:
 *   import { Properties, ColorFunction, MathFunction } from '@cssints/types';
 */

// Re-export all CSS property types from csstype
export type {
	Properties,
	PropertiesHyphen,
	StandardProperties,
	StandardPropertiesHyphen,
	SvgProperties,
	SvgPropertiesHyphen,
} from "csstype";

// Re-export CSS value types
export * from "./value-types.js";
