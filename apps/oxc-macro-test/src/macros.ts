import { macro } from "oxc-macro";

export const version = macro(() => {
	return "1.2.3";
});

export const config = macro(() => {
	return { theme: "dark", locale: "en", debug: false };
});

export const buttonStyles = macro(() => ({
	value: { className: "btn-abc123" },
	assets: [
		{
			type: "css",
			content: ".btn-abc123{padding:0.5rem 1rem;background:#3b82f6;color:white;border-radius:0.375rem}",
			name: "button.css",
		},
	],
}));
