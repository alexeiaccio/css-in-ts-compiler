import * as css from 'cssints' with { type: 'macro' };

export const button = css.cv({
	base: [css.inlineFlex(css.alignItems('center'), css.justifyContent('center')), css.borderRadius('0.375rem'), css.fontWeight(500), css.transition('all', '0.2s')],

	variants: {
		variant: {
			primary: [css.backgroundColor('#3b82f6'), css.color('white'), css.border('1px', 'solid', '#3b82f6')],
			secondary: [css.backgroundColor('#6b7280'), css.color('white'), css.border('1px', 'solid', '#6b7280')],
			outline: [css.backgroundColor('transparent'), css.color('#3b82f6'), css.border('1px', 'solid', '#3b82f6')],
			ghost: [css.backgroundColor('transparent'), css.color('#3b82f6'), css.border('1px', 'solid', 'transparent')]
		},

		size: {
			sm: [css.padding('0.375rem', '0.75rem'), css.fontSize('0.875rem'), css.height('2rem')],
			md: [css.padding('0.5rem', '1rem'), css.fontSize('1rem'), css.height('2.5rem')],
			lg: [css.padding('0.75rem', '1.5rem'), css.fontSize('1.125rem'), css.height('3rem')]
		},

		fullWidth: {
			true: [css.width('100%')],
			false: [css.width('auto')]
		}
	},

	defaultVariants: {
		variant: 'primary',
		size: 'md',
		fullWidth: 'false'
	}
});

type ButtonVariants = Parameters<typeof button>[0];

export function Button({
	variant,
	size,
	fullWidth,
	children,
	onClick,
	disabled
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
	return (
		<button
			className={button({
				variant: variant ?? 'primary',
				size: size ?? 'md',
				fullWidth: fullWidth ? 'true' : 'false'
			})}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
