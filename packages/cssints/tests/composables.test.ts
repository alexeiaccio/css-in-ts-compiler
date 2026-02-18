import { describe, it, expect } from "vitest";
import { flex, items, justify, direction, wrap, gap } from "../lib/composables";
import { grid, cols, rows } from "../lib/composables";
import { absolute, relative, fixed, sticky, insetAll, top, right, bottom, left } from "../lib/composables";
import { w, h, minW, maxW, minH, maxH } from "../lib/composables";
import { text, font, weight, leading, size } from "../lib/composables";
import { overflow, overflowX, overflowY, hidden, scroll } from "../lib/composables";
import { m, p, mx, my, padX, padY } from "../lib/composables";
import { scaleValue, scaleShorthand } from "../lib/scale";

describe("scale", () => {
	it("scales numbers to rem", () => {
		expect(scaleValue(4)).toBe("1rem");
		expect(scaleValue(1)).toBe("0.25rem");
		expect(scaleValue(0)).toBe("0rem");
	});

	it("passes strings through", () => {
		expect(scaleValue("1rem")).toBe("1rem");
		expect(scaleValue("100%")).toBe("100%");
	});

	it("handles shorthand values", () => {
		expect(scaleShorthand(1)).toBe("0.25rem");
		expect(scaleShorthand(1, 2)).toBe("0.25rem 0.5rem");
		expect(scaleShorthand(1, 2, 3)).toBe("0.25rem 0.5rem 0.75rem");
		expect(scaleShorthand(1, 2, 3, 4)).toBe("0.25rem 0.5rem 0.75rem 1rem");
	});
});

describe("flex utilities", () => {
	it("creates flex container", () => {
		const result = flex();
		expect(result).toEqual({ display: "flex" });
	});

	it("composes with items and justify", () => {
		const result = flex(items("center"), justify("center"));
		expect(result).toEqual({
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		});
	});

	it("maps items values", () => {
		expect(items("start")).toEqual({ alignItems: "flex-start" });
		expect(items("end")).toEqual({ alignItems: "flex-end" });
		expect(items("center")).toEqual({ alignItems: "center" });
		expect(items("stretch")).toEqual({ alignItems: "stretch" });
	});

	it("maps justify values", () => {
		expect(justify("start")).toEqual({ justifyContent: "flex-start" });
		expect(justify("end")).toEqual({ justifyContent: "flex-end" });
		expect(justify("between")).toEqual({ justifyContent: "space-between" });
		expect(justify("around")).toEqual({ justifyContent: "space-around" });
		expect(justify("evenly")).toEqual({ justifyContent: "space-evenly" });
	});

	it("sets direction", () => {
		expect(direction("column")).toEqual({ flexDirection: "column" });
		expect(direction("row-reverse")).toEqual({ flexDirection: "row-reverse" });
	});

	it("sets wrap", () => {
		expect(wrap()).toEqual({ flexWrap: "wrap" });
		expect(wrap("nowrap")).toEqual({ flexWrap: "nowrap" });
	});

	it("sets gap with scale", () => {
		expect(gap(4)).toEqual({ gap: "1rem" });
		expect(gap("1rem")).toEqual({ gap: "1rem" });
	});
});

describe("grid utilities", () => {
	it("creates grid container", () => {
		const result = grid();
		expect(result).toEqual({ display: "grid" });
	});

	it("composes with cols and rows", () => {
		const result = grid(cols("1fr 1fr"), rows("auto"));
		expect(result).toEqual({
			display: "grid",
			gridTemplateColumns: "1fr 1fr",
			gridTemplateRows: "auto",
		});
	});
});

describe("positioning utilities", () => {
	it("creates absolute positioned element", () => {
		const result = absolute(insetAll(0));
		expect(result).toEqual({
			position: "absolute",
			top: "0rem",
			right: "0rem",
			bottom: "0rem",
			left: "0rem",
		});
	});

	it("creates relative positioned element", () => {
		expect(relative()).toEqual({ position: "relative" });
	});

	it("creates fixed positioned element", () => {
		expect(fixed()).toEqual({ position: "fixed" });
	});

	it("creates sticky positioned element", () => {
		expect(sticky()).toEqual({ position: "sticky" });
	});

	it("sets inset with scale", () => {
		expect(insetAll(4)).toEqual({
			top: "1rem",
			right: "1rem",
			bottom: "1rem",
			left: "1rem",
		});
	});

	it("sets inset auto", () => {
		expect(insetAll("auto")).toEqual({
			top: "auto",
			right: "auto",
			bottom: "auto",
			left: "auto",
		});
	});

	it("sets individual sides", () => {
		expect(top(4)).toEqual({ top: "1rem" });
		expect(right("auto")).toEqual({ right: "auto" });
		expect(bottom(0)).toEqual({ bottom: "0rem" });
		expect(left(2)).toEqual({ left: "0.5rem" });
	});
});

describe("sizing utilities", () => {
	it("sets width with scale", () => {
		expect(w(100)).toEqual({ width: "25rem" });
		expect(w("100%")).toEqual({ width: "100%" });
		expect(w("auto")).toEqual({ width: "auto" });
	});

	it("sets height", () => {
		expect(h(50)).toEqual({ height: "12.5rem" });
		expect(h("50vh")).toEqual({ height: "50vh" });
	});

	it("sets min/max dimensions", () => {
		expect(minW(10)).toEqual({ minWidth: "2.5rem" });
		expect(maxW(100)).toEqual({ maxWidth: "25rem" });
		expect(minH(10)).toEqual({ minHeight: "2.5rem" });
		expect(maxH(100)).toEqual({ maxHeight: "25rem" });
	});
});

describe("text utilities", () => {
	it("sets text-align", () => {
		expect(text("center")).toEqual({ textAlign: "center" });
		expect(text("left")).toEqual({ textAlign: "left" });
		expect(text("justify")).toEqual({ textAlign: "justify" });
	});

	it("sets font-family", () => {
		expect(font("sans-serif")).toEqual({ fontFamily: "sans-serif" });
	});

	it("sets font-weight", () => {
		expect(weight("bold")).toEqual({ fontWeight: "bold" });
		expect(weight(700)).toEqual({ fontWeight: "700" });
	});

	it("sets line-height", () => {
		expect(leading(1.5)).toEqual({ lineHeight: "1.5" });
		expect(leading("2rem")).toEqual({ lineHeight: "2rem" });
	});

	it("sets font-size with scale", () => {
		expect(size(4)).toEqual({ fontSize: "1rem" });
		expect(size("16px")).toEqual({ fontSize: "16px" });
	});
});

describe("overflow utilities", () => {
	it("sets overflow", () => {
		expect(overflow("hidden")).toEqual({ overflow: "hidden" });
		expect(overflow("scroll")).toEqual({ overflow: "scroll" });
		expect(overflow("auto")).toEqual({ overflow: "auto" });
	});

	it("sets overflow-x and overflow-y", () => {
		expect(overflowX("hidden")).toEqual({ overflowX: "hidden" });
		expect(overflowY("scroll")).toEqual({ overflowY: "scroll" });
	});

	it("provides shorthand helpers", () => {
		expect(hidden()).toEqual({ overflow: "hidden" });
		expect(scroll()).toEqual({ overflow: "scroll" });
	});
});

describe("margin & padding utilities", () => {
	it("sets margin with multi-param", () => {
		expect(m(4)).toEqual({ margin: "1rem" });
		expect(m(1, 2)).toEqual({ margin: "0.25rem 0.5rem" });
		expect(m(1, 2, 3, 4)).toEqual({ margin: "0.25rem 0.5rem 0.75rem 1rem" });
	});

	it("sets padding with multi-param", () => {
		expect(p(4)).toEqual({ padding: "1rem" });
		expect(p(1, 2)).toEqual({ padding: "0.25rem 0.5rem" });
	});

	it("sets mx and my", () => {
		expect(mx(4)).toEqual({ marginLeft: "1rem", marginRight: "1rem" });
		expect(my(2)).toEqual({ marginTop: "0.5rem", marginBottom: "0.5rem" });
	});

	it("sets padX and padY", () => {
		expect(padX(4)).toEqual({ paddingLeft: "1rem", paddingRight: "1rem" });
		expect(padY(2)).toEqual({ paddingTop: "0.5rem", paddingBottom: "0.5rem" });
	});

	it("handles mixed string/number", () => {
		expect(m(1, "auto")).toEqual({ margin: "0.25rem auto" });
		expect(p("1rem", 2)).toEqual({ padding: "1rem 0.5rem" });
	});
});
