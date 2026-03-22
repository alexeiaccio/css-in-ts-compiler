import { cv } from "cssints" with { type: "macro" };
import { _cv } from "cssints";

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
			<div style={{ padding: "1.5rem 1.5rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{title}</h3>
				{description && <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>{description}</p>}
			</div>
			<div style={{ padding: "1.5rem", color: "#374151" }}>{children}</div>
			{footer && <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>{footer}</div>}
		</div>
	);
}
