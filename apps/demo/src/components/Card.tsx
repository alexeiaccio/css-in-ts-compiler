import * as css from 'cssints' with { type: 'macro' };

export const card = css.scv({
	slots: ['root', 'header', 'title', 'description', 'content', 'footer'],

	base: {
		root: 'background-color: white; border-radius: 0.5rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1)',
		header: 'padding: 1.5rem 1.5rem 0; display: flex; flex-direction: column; gap: 0.5rem',
		title: 'font-size: 1.25rem; font-weight: 600; color: #111827; line-height: 1.4',
		description: 'font-size: 0.875rem; color: #6b7280; line-height: 1.5',
		content: 'padding: 1.5rem; color: #374151',
		footer: 'padding: 0 1.5rem 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end'
	},

	variants: {
		variant: {
			default: {
				root: 'background-color: white; border-color: #e5e7eb'
			},
			destructive: {
				root: 'background-color: white; border-color: #fca5a5',
				title: 'color: #dc2626'
			}
		},

		size: {
			sm: {
				root: 'max-width: 20rem',
				title: 'font-size: 1rem'
			},
			md: {
				root: 'max-width: 28rem',
				title: 'font-size: 1.25rem'
			},
			lg: {
				root: 'max-width: 32rem',
				title: 'font-size: 1.5rem'
			}
		}
	},

	defaultVariants: {
		variant: 'default',
		size: 'md'
	}
});

// Example usage type
export type CardProps = {
	variant?: 'default' | 'destructive';
	size?: 'sm' | 'md' | 'lg';
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
};


export function Card({
	variant,
	size,
	title,
	description,
	children,
	footer
}: CardProps) {
	const classes = card({ variant: variant ?? 'default', size: size ?? 'md' });

	return (
		<div className={classes.root}>
			<div className={classes.header}>
				<h3 className={classes.title}>{title}</h3>
				{description && <p className={classes.description}>{description}</p>}
			</div>
			<div className={classes.content}>{children}</div>
			{footer && <div className={classes.footer}>{footer}</div>}
		</div>
	);
}
