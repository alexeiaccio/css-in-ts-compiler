import { describe, it, expect } from "vitest";
import {
	token,
	color,
	length,
	angle,
	time,
	percentage,
	number,
	set,
	setMultiple,
	style,
	generatePropertyCSS,
} from "../lib/tokens";

describe("Token System", () => {
	describe("color tokens", () => {
		it("creates a color token with string name", () => {
			const blue = color("blue", "color-primary");

			expect(blue.name).toBe("color-primary");
			expect(blue.cssName).toBe("--color-primary");
			expect(blue.type).toBe("color");
			expect(blue.syntax).toBe("<color>");
			expect(blue.inherits).toBe(true);
			expect(blue.initialValue).toBe("blue");
			expect(blue.token).toBe("var(--color-primary)");
		});

		it("creates a color token with options", () => {
			const blue = color("#0066cc", { var: "brand-primary", inherit: false });

			expect(blue.name).toBe("brand-primary");
			expect(blue.inherits).toBe(false);
		});
	});

	describe("length tokens", () => {
		it("creates a length token", () => {
			const spacing = length("1rem", "spacing-base");

			expect(spacing.type).toBe("length");
			expect(spacing.syntax).toBe("<length>");
			expect(spacing.token).toBe("var(--spacing-base)");
		});
	});

	describe("angle tokens", () => {
		it("creates an angle token", () => {
			const rotation = angle("45deg", "rotation-amount");

			expect(rotation.type).toBe("angle");
			expect(rotation.syntax).toBe("<angle>");
		});
	});

	describe("time tokens", () => {
		it("creates a time token", () => {
			const duration = time("300ms", "transition-duration");

			expect(duration.type).toBe("time");
			expect(duration.syntax).toBe("<time>");
		});
	});

	describe("percentage tokens", () => {
		it("creates a percentage token", () => {
			const opacity = percentage("50%", "opacity-value");

			expect(opacity.type).toBe("percentage");
			expect(opacity.syntax).toBe("<percentage>");
		});
	});

	describe("number tokens", () => {
		it("creates a number token", () => {
			const scale = number(1.5, "scale-factor");

			expect(scale.type).toBe("number");
			expect(scale.syntax).toBe("<number>");
		});
	});

	describe("token convenience object", () => {
		it("creates tokens via token.color()", () => {
			const red = token.color("red", "danger-1");

			expect(red.type).toBe("color");
			expect(red.token).toBe("var(--danger-1)");
		});

		it("creates tokens via token.length()", () => {
			const gap = token.length("8px", "gap-size-1");

			expect(gap.type).toBe("length");
		});

		it("creates tokens via token.px()", () => {
			const padding = token.px(16, "padding-base-1");

			expect(padding.type).toBe("length");
			expect(padding.initialValue).toBe("16px");
		});

		it("creates tokens via token.rem()", () => {
			const size = token.rem(1.5, "font-size-lg-1");

			expect(size.type).toBe("length");
			expect(size.initialValue).toBe("1.5rem");
		});

		it("creates tokens via token.deg()", () => {
			const deg = token.deg(90, "rotate-amount-1");

			expect(deg.type).toBe("angle");
			expect(deg.initialValue).toBe("90deg");
		});

		it("creates tokens via token.sec()", () => {
			const duration = token.sec(0.3, "animation-duration-1");

			expect(duration.type).toBe("time");
			expect(duration.initialValue).toBe("0.3s");
		});
	});

	describe("set function", () => {
		it("creates style object for setting token value", () => {
			const blue = token.color("blue", "primary-1");
			const result = set(blue.token, "red");

			expect(result).toEqual({ "--primary-1": "red" });
		});
	});

	describe("setMultiple function", () => {
		it("creates style object for multiple tokens", () => {
			const c = token.color("blue", "primary-2");
			const s = token.length("1rem", "size-2");

			const result = setMultiple(
				[c.token, "red"],
				[s.token, "2rem"],
			);

			expect(result).toEqual({
				"--primary-2": "red",
				"--size-2": "2rem",
			});
		});
	});

	describe("style function", () => {
		it("combines style objects", () => {
			const c = token.color("blue", "primary-3");

			const result = style(
				{ color: "red" },
				[c.token, "green"],
			);

			expect(result).toEqual({
				color: "red",
				"--primary-3": "green",
			});
		});
	});

	describe("@property CSS generation", () => {
		it("generates CSS @property rules", () => {
			token.color("blue", "primary-4");
			token.length("1rem", "spacing-4");

			const css = generatePropertyCSS();

			expect(css).toContain("@property --primary-4");
			expect(css).toContain('syntax: "<color>"');
			expect(css).toContain("@property --spacing-4");
			expect(css).toContain('syntax: "<length>"');
		});
	});
});
