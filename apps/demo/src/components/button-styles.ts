import { cv } from "cssints" with { type: "macro" };

export const button = cv({
	base: "display: inline-flex; align-items: center; justify-content: center; border-radius: 0.375rem; font-weight: 500; transition: all 0.2s; cursor: pointer; border: none",

	variants: {
		variant: {
			primary: "background-color: #3b82f6; color: white",
			secondary: "background-color: #6b7280; color: white",
			outline: "background-color: transparent; color: #3b82f6; border: 1px solid #3b82f6",
			ghost: "background-color: transparent; color: #3b82f6",
		},

		size: {
			sm: "padding: 0.375rem 0.75rem; font-size: 0.875rem; height: 2rem",
			md: "padding: 0.5rem 1rem; font-size: 1rem; height: 2.5rem",
			lg: "padding: 0.75rem 1.5rem; font-size: 1.125rem; height: 3rem",
		},

		fullWidth: {
			true: "width: 100%",
			false: "width: auto",
		},
	},

	defaultVariants: {
		variant: "primary",
		size: "md",
		fullWidth: "false",
	},
});
