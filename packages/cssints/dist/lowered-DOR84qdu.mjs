import { a as registry } from "./registry-D-OHolzA.mjs";
import { Result } from "effect";
import { browserslistToTargets, transform } from "lightningcss";
//#region src/lowered.ts
const first = (css) => /^[^{]*\{([^;}]*)/.exec(css)?.[1];
const lower = (prop, value, lacking, feature) => {
	const code = Buffer.from(prop.startsWith("--") ? `:root{${prop}:${value}}` : `x{${prop}:${value}}`);
	const out = first(transform({
		filename: "x.css",
		code,
		minify: true,
		targets: browserslistToTargets(lacking)
	}).code.toString());
	const holds = new RegExp(`(?<![\\w-])${feature.replace(/\(\)$/, "")}(?![\\w-])`);
	return out !== void 0 && holds.test(`${prop}:${value}`) && !holds.test(out) ? out.slice(out.indexOf(":") + 1) : void 0;
};
const fallbackOf = (prop, value, w) => {
	const key = `${prop}\0${value}\0${w.feature}\0${w.lacking.join()}`;
	let hit = registry.lowered.get(key);
	if (hit === void 0) {
		hit = Result.getOrElse(Result.try(() => lower(prop, value, w.lacking, w.feature)), () => void 0) ?? false;
		registry.lowered.set(key, hit);
	}
	return hit || void 0;
};
const loweredOf = (prop, value, w) => fallbackOf(prop, value, w) !== void 0;
//#endregion
export { loweredOf as n, fallbackOf as t };
