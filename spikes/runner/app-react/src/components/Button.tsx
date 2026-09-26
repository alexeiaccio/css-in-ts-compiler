import { display, items, justify, p, bg, color, borderRadius, fontWeight, transition, border, cursor, fontSize, height, width } from "cssints";
import { cx } from "cssints";

const base = [
	display("inline-flex"),
	items("center"),
	justify("center"),
	borderRadius("0.375rem"),
	fontWeight("500"),
	transition("all 0.2s"),
	cursor("pointer"),
	border("none"),
];

// Variant classes
const primary = [bg("#3b82f6"), color("white"), border("1px solid #3b82f6")];
const secondary = [bg("#6b7280"), color("white"), border("1px solid #6b7280")];
const outline = [bg("transparent"), color("#3b82f6"), border("1px solid #3b82f6")];
const ghost = [bg("transparent"), color("#3b82f6"), border("1px solid transparent")];

// Size classes
const sm = [p("0.375rem"), fontSize("0.875rem"), height("2rem")];
const md = [p("0.5rem 1rem"), fontSize("1rem"), height("2.5rem")];
const lg = [p("0.75rem 1.5rem"), fontSize("1.125rem"), height("3rem")];

type ButtonVariants = {
	variant?: "primary" | "secondary" | "outline" | "ghost";
	size?: "sm" | "md" | "lg";
	fullWidth?: boolean;
};

export function Button({
	variant = "primary",
	size = "md",
	fullWidth,
	children,
	onClick,
	disabled,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
	const variantClasses = variant === "primary" ? primary
		: variant === "secondary" ? secondary
			: variant === "outline" ? outline
				: ghost;

	const sizeClasses = size === "sm" ? sm
		: size === "lg" ? lg
			: md;

	return (
		<button
			className={cx(
				...base,
				...variantClasses,
				...sizeClasses,
				fullWidth && width("100%"),
			)}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
