// Comprehensive example demonstrating CSS-in-TS compiler features

import { createSizes, createMedia } from "./src/api";
import { style, cx, generateCSS, setFileScope } from "./src/compiler";
import { token, resolveToken, getCSSVariables } from "./src/tokens";
import {
	flex,
	flexDirection,
	flexWrap,
	alignItems,
	justifyContent,
	fontBold,
	bg,
	textCol,
	cursor,
	transition,
	scale,
	hover,
	textAlign,
	border,
	borderRadius,
} from "./src/utilities";

// Set file scope for this example
setFileScope("/example.ts");

const { p, px, text, rounded } = createSizes();

const { sm, md, lg, xl, xxl } = createMedia({
	sm: "screen and (min-width: 640px)",
	md: "screen and (min-width: 768px)",
	lg: "screen and (min-width: 1024px)",
	xl: "screen and (min-width: 1280px)",
	xxl: "screen and (min-width: 1536px)",
});

// Example 1: Style definition with hash-based class name (vanilla-extract pattern)
const button = style("button", {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "0.75rem 1.5rem",
	backgroundColor: token("color.primary"),
	color: "white",
	borderRadius: token("borderRadius.DEFAULT"),
	fontWeight: "bold",
	cursor: "pointer",
	transition: "all 150ms ease-in-out",
	"&:hover": {
		backgroundColor: token("color.secondary"),
		transform: "scale(1.05)",
	},
	"&:active": {
		transform: "scale(0.98)",
	},
});

// Example 2: Responsive component
const card = style("card", {
	display: "flex",
	flexDirection: "column",
	padding: "1rem",
	backgroundColor: "white",
	borderRadius: "0.5rem",
	boxShadow: token("shadow.DEFAULT"),
	"@media (min-width: 768px)": {
		padding: "1.5rem",
		borderRadius: "0.75rem",
	},
	"@media (min-width: 1024px)": {
		padding: "2rem",
	},
});

// Example 3: Composing utilities with cx() using parameter-based API
const heading = cx(text(6), fontBold(), textCol(token("color.neutral.900")), md(text(8)), lg(text(10)));

// Example 4: Using design tokens directly
const container = style("container", {
	maxWidth: "1280px",
	margin: "0 auto",
	padding: token("spacing.4"),
	backgroundColor: token("color.neutral.50"),
});

// Example 5: Atomic utility composition with parameter-based API
const flexCenter = cx(flex(), alignItems("center"), justifyContent("center"));

// Example 6: Complex component with multiple states
const input = style("input", {
	width: "100%",
	padding: "0.5rem 1rem",
	fontSize: "1rem",
	border: `1px solid ${token("color.neutral.300")}`,
	borderRadius: token("borderRadius.DEFAULT"),
	backgroundColor: "white",
	transition: "border-color 150ms ease-in-out, box-shadow 150ms ease-in-out",
	"&:focus": {
		outline: "none",
		borderColor: token("color.primary"),
		boxShadow: `0 0 0 3px ${token("color.primary")}33`,
	},
	"&:disabled": {
		backgroundColor: token("color.neutral.100"),
		cursor: "not-allowed",
	},
});

// Example 7: Component with pseudo-elements
const badge = style("badge", {
	position: "relative",
	display: "inline-flex",
	alignItems: "center",
	padding: "0.25rem 0.75rem",
	backgroundColor: token("color.success"),
	color: "white",
	fontSize: "0.75rem",
	fontWeight: "600",
	borderRadius: "9999px",
	"&::before": {
		content: '""',
		position: "absolute",
		top: "-2px",
		left: "-2px",
		right: "-2px",
		bottom: "-2px",
		border: `2px solid ${token("color.success")}`,
		borderRadius: "9999px",
		opacity: "0.5",
	},
});

// Example 8: Responsive utility composition
const responsivePadding = cx(p(2), sm(p(4)), md(p(6)), lg(p(8)), xl(p(10)), xxl(p(12)));

// Example 9: Using resolved token values
const resolvedPrimaryColor = resolveToken("color.primary");
const resolvedSpacing = resolveToken("spacing.4");

const resolvedExample = style("resolvedExample", {
	color: resolvedPrimaryColor,
	padding: resolvedSpacing,
});

// Example 10: CSS Variables output
const cssVariables = getCSSVariables();
const variablesExample = style("variablesExample", {
	...cssVariables,
	color: token("color.primary"),
	padding: token("spacing.4"),
});

// Example 11: Parameter-based utilities
const flexRowWrap = cx(flex(), flexDirection("row"), flexWrap("wrap"), justifyContent("center"), alignItems("center"));

const textAlignments = {
	left: cx(textAlign("left")),
	center: cx(textAlign("center")),
	right: cx(textAlign("right")),
};

const customBorder = cx(border(2, "red"), borderRadius("8px"));

// Print examples
console.log("=".repeat(60));
console.log("CSS-in-TS Compiler Examples");
console.log("=".repeat(60));

console.log("\n1. Button style (hash-based class name):");
console.log(`   className: ${button}`);

console.log("\n2. Card style (responsive):");
console.log(`   className: ${card}`);

console.log("\n3. Heading (composed utilities):");
console.log(`   className: ${heading}`);

console.log("\n4. Container (design tokens):");
console.log(`   className: ${container}`);

console.log("\n5. Flex center (atomic composition):");
console.log(`   className: ${flexCenter}`);

console.log("\n6. Input (multiple states):");
console.log(`   className: ${input}`);

console.log("\n7. Badge (pseudo-elements):");
console.log(`   className: ${badge}`);

console.log("\n8. Responsive padding:");
console.log(`   className: ${responsivePadding}`);

console.log("\n9. Resolved tokens:");
console.log(`   className: ${resolvedExample}`);
console.log(`   Primary color: ${resolvedPrimaryColor}`);
console.log(`   Spacing: ${resolvedSpacing}`);

console.log("\n10. CSS Variables:");
console.log(`    className: ${variablesExample}`);
console.log(`    Variables:`, Object.keys(cssVariables).slice(0, 5), "...");

console.log("\n11. Parameter-based utilities:");
console.log(`    Flex row wrap: ${flexRowWrap}`);
console.log(`    Text center: ${textAlignments.center}`);
console.log(`    Custom border: ${customBorder}`);

// Generate and print CSS
console.log("\n" + "=".repeat(60));
console.log("Generated CSS");
console.log("=".repeat(60));
console.log(generateCSS());
console.log("\n" + "=".repeat(60));

// Export for React component example
export const styles = {
	button,
	card,
	heading,
	container,
	flexCenter,
	input,
	badge,
	responsivePadding,
	resolvedExample,
	variablesExample,
	flexRowWrap,
	textAlignments,
	customBorder,
};

// Example React component usage
/*
import React from 'react';
import { styles } from './example';

function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={styles.button} {...props}>
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      {children}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className={styles.heading}>
      {children}
    </h1>
  );
}
*/
