import { _cv, cx } from "cssints";
import { cv, flex, padding, fontSize, fontWeight, color, lineHeight } from "cssints" with { type: "cssints" };

const rootConfig = cv({
	base: "background-color: white; border-radius: 0.5rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1)",
	variants: {
		variant: {
			default: "background-color: white; border-color: #e5e7eb",
			destructive: "background-color: white; border-color: #fca5a5",
		},
		size: {
			sm: "max-width: 20rem",
			md: "max-width: 28rem",
			lg: "max-width: 32rem",
		},
	},
	defaultVariants: { variant: "default", size: "md" },
});

const root = _cv(rootConfig);

const headerSlot = [padding("1.5rem 1.5rem 0"), flex().direction("column").gap("0.5rem")];
const titleSlot = [fontSize("1.25rem"), fontWeight("600"), color("#111827"), lineHeight("1.4")];
const descSlot = [fontSize("0.875rem"), color("#6b7280"), lineHeight("1.5")];
const contentSlot = [padding("1.5rem"), color("#374151")];
const footerSlot = [padding("0 1.5rem 1.5rem"), flex().gap("0.75rem").justifyContent("flex-end")];

export type CardProps = {
	variant?: "default" | "destructive";
	size?: "sm" | "md" | "lg";
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
};

export function Card({ variant, size, title, description, children, footer }: CardProps) {
	return (
		<div className={root({ variant: variant ?? "default", size: size ?? "md" })}>
			<div className={cx(...headerSlot)}>
				<h3 className={cx(...titleSlot)}>{title}</h3>
				{description && <p className={cx(...descSlot)}>{description}</p>}
			</div>
			<div className={cx(...contentSlot)}>{children}</div>
			{footer && <div className={cx(...footerSlot)}>{footer}</div>}
		</div>
	);
}
