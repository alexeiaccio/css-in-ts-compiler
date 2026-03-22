import { cv } from "cssints" with { type: "macro" };
import { _cv } from "cssints";

const buttonConfig = cv({
	base: "display: inline-flex; align-items: center; border-radius: 0.375rem",
	variants: {
		variant: {
			primary: "background-color: #3b82f6; color: white",
			secondary: "background-color: #6b7280; color: white",
		},
		size: {
			sm: "padding: 0.375rem 0.75rem; font-size: 0.875rem",
			md: "padding: 0.5rem 1rem; font-size: 1rem",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "md",
	},
});

const button = _cv(buttonConfig);

document.getElementById("app")!.innerHTML = `
<h1>cssints + oxc-macro</h1>
<p>Default: <span class="${button()}">${button()}</span></p>
<p>Primary SM: <span class="${button({ variant: "primary", size: "sm" })}">${button({ variant: "primary", size: "sm" })}</span></p>
<p>Secondary MD: <span class="${button({ variant: "secondary", size: "md" })}">${button({ variant: "secondary", size: "md" })}</span></p>
`;
