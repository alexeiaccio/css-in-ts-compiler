//#region src/values.ts
var CSSStyleValue = class {};
var CSSUnitValue = class extends CSSStyleValue {
	value;
	unit;
	constructor(value, unit) {
		super();
		this.value = value;
		this.unit = unit;
	}
	toString() {
		return `${this.value}${this.unit === "percent" ? "%" : this.unit === "number" ? "" : this.unit}`;
	}
};
var CSSColorValue = class extends CSSStyleValue {
	value;
	constructor(value) {
		super();
		this.value = value;
	}
	toString() {
		return this.value;
	}
};
var CSSImageValue = class extends CSSStyleValue {
	value;
	constructor(value) {
		super();
		this.value = value;
	}
	toString() {
		return this.value;
	}
};
const unit = (u) => (v) => new CSSUnitValue(v, u);
const CSS = {
	px: unit("px"),
	rem: unit("rem"),
	em: unit("em"),
	percent: unit("percent"),
	number: unit("number")
};
//#endregion
export { CSS, CSSColorValue, CSSImageValue, CSSStyleValue, CSSUnitValue };
