import { bg, color, cn, cv, flex, hover, media, p, style, token } from "cssints" with { type: "cssints" };

const md = media("(width >= 40rem)");
const accent = token.color("#2563eb", "accent");

const button = cv({
	base: cn(p(2), color("white"), bg(accent), hover(bg("#1d4ed8"))),
	variants: { wide: { true: md(p(4)) } },
});

export const Row = ({ wide, on }: { wide?: boolean; on?: boolean }) => (
	<div className={cn(flex().alignItems("center").gap(2), on && p(1))} style={style(token.set(accent, "#dc2626"))}>
		<button className={button({ wide })}>Save</button>
	</div>
);
