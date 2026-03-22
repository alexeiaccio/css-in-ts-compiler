import { cv } from "cssints" with { type: "macro" };
import { _cv } from "cssints";

export const buttonConfig = cv({
	base: "display: inline-flex; align-items: center; justify-content: center; border-radius: 0.375rem; font-weight: 500; transition: all 0.2s; cursor: pointer; border: none",

	variants: {
		variant: {
			primary: "background-color: #3b82f6; color: white; border: 1px solid #3b82f6",
			secondary: "background-color: #6b7280; color: white; border: 1px solid #6b7280",
			outline: "background-color: transparent; color: #3b82f6; border: 1px solid #3b82f6",
			ghost: "background-color: transparent; color: #3b82f6; border: 1px solid transparent",
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

const button = _cv(buttonConfig);

type ButtonVariants = {
	variant?: "primary" | "secondary" | "outline" | "ghost";
	size?: "sm" | "md" | "lg";
	fullWidth?: boolean;
};

export function Button({
	variant,
	size,
	fullWidth,
	children,
	onClick,
	disabled,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
	return (
		<button
			className={button({
				variant: variant ?? "primary",
				size: size ?? "md",
				fullWidth: fullWidth ? "true" : "false",
			})}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
