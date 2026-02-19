import { describe, it, expect } from "vitest";
import type {
	Length, Angle,
	Px, Rem, Deg, Turn,
	LengthPercentage, AnglePercentage,
} from "../lib/value-types";
import type { Color } from "../lib/tokens";

// Helper functions for unit creation
const px = (v: number): Px => `${v}px`;
const rem = (v: number): Rem => `${v}rem`;
const em = (v: number) => `${v}em`;
const deg = (v: number): Deg => `${v}deg`;
const turn = (v: number): Turn => `${v}turn`;
const sec = (v: number) => `${v}s`;
const ms = (v: number) => `${v}ms`;
const pct = (v: number) => `${v}%`;

describe("Primitive Types", () => {
	it("Length accepts number and unit strings", () => {
		const l1: Length = 10;
		const l2: Length = "10px";
		const l3: Length = "1rem";
		const l4: Length = "2em";
		
		expect(l1).toBe(10);
		expect(l2).toBe("10px");
	});

	it("Angle accepts deg, rad, grad, turn", () => {
		const a1: Angle = 45;
		const a2: Angle = "45deg";
		const a3: Angle = "1turn";
		
		expect(a1).toBe(45);
		expect(a2).toBe("45deg");
	});

	it("Color accepts color strings", () => {
		const c1: Color = "red";
		const c2: Color = "#fff";
		const c3: Color = "rgb(255, 0, 0)";
		
		expect(c1).toBe("red");
		expect(c2).toBe("#fff");
	});

	it("Unit helpers produce correct values", () => {
		expect(px(10)).toBe("10px");
		expect(rem(2)).toBe("2rem");
		expect(em(1.5)).toBe("1.5em");
		expect(deg(90)).toBe("90deg");
		expect(turn(0.5)).toBe("0.5turn");
		expect(pct(50)).toBe("50%");
		expect(sec(1)).toBe("1s");
		expect(ms(500)).toBe("500ms");
	});

	it("Unit helpers return correct types", () => {
		const p: Px = px(10);
		const r: Rem = rem(2);
		const d: Deg = deg(90);
		const t: Turn = turn(0.5);
		
		expect(p).toBe("10px");
		expect(r).toBe("2rem");
	});
});

describe("Composite Types", () => {
	it("LengthPercentage accepts both length and percentage", () => {
		const lp1: LengthPercentage = 10;
		const lp2: LengthPercentage = "10px";
		const lp3: LengthPercentage = "50%";
		
		expect(lp1).toBe(10);
		expect(lp3).toBe("50%");
	});

	it("AnglePercentage accepts both angle and percentage", () => {
		const ap1: AnglePercentage = 45;
		const ap2: AnglePercentage = "45deg";
		const ap3: AnglePercentage = "50%";
		
		expect(ap1).toBe(45);
		expect(ap3).toBe("50%");
	});
});
