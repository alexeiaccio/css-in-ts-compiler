import { InvalidValueError } from "./errors.mjs";
//#region src/selector.ts
const I = String.raw`(?:--|-?(?:[A-Za-z_\u0080-\uffff]|\\.))(?:[\w\u0080-\uffff-]|\\.)*`;
const STR = String.raw`"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'`;
const NS = String.raw`(?:(?:${I}|\*)?\|)?`;
const y = (src) => new RegExp(src, "y");
const TYPE = y(`${NS}(?:${I}|\\*)`);
const SUB = y(String.raw`#${I}|\.${I}|\[\s*${NS}${I}\s*(?:[~|^$*]?=\s*(?:${STR}|${I})\s*[is]?\s*)?\]|::?${I}`);
const COMB = y(String.raw`(?:\|\||[>+~])\s*`);
const WS = y(String.raw`\s+`);
const close = (s, i) => {
	for (let depth = 0, j = i; j < s.length; j++) {
		const c = s[j];
		if (c === "\\") j++;
		else if (c === "\"" || c === "'") {
			const end = new RegExp(`${c}(?:[^${c}\\\\]|\\\\.)*${c}`, "y");
			end.lastIndex = j;
			const m = end.exec(s);
			if (!m) return -1;
			j += m[0].length - 1;
		} else if (c === "(") depth++;
		else if (c === ")" && !--depth) return /^\(\s*\)$/.test(s.slice(i, j + 1)) ? -1 : j + 1;
	}
	return -1;
};
function checkSelectorNow(sel) {
	let i = 0;
	const eat = (re) => {
		re.lastIndex = i;
		const m = re.exec(sel);
		if (m) i += m[0].length;
		return m?.[0];
	};
	const stop = () => {
		const token = /^,|^[^\s,]*/.exec(sel.slice(i))[0];
		throw new InvalidValueError({
			message: `selector: ${token ? `unexpected "${token}"` : "unexpected end"} in "${sel}", expected <complex-selector-list>`,
			property: "selector",
			value: sel,
			position: i,
			expected: ["<complex-selector-list>"]
		});
	};
	const compound = () => {
		const start = i;
		let pseudoElement = false;
		eat(TYPE);
		for (let s; s = eat(SUB);) {
			if (pseudoElement && s[0] !== ":") {
				i -= s.length;
				return stop();
			}
			if (s.startsWith("::")) pseudoElement = true;
			if (sel[i] === "(" && s[0] === ":") {
				const end = close(sel, i);
				if (end < 0) return stop();
				i = end;
			}
		}
		if (i === start) stop();
	};
	eat(WS);
	for (;;) {
		compound();
		for (;;) {
			const space = eat(WS);
			if (i === sel.length) return;
			if (sel[i] === ",") {
				i++;
				eat(WS);
				break;
			}
			if (!eat(COMB) && !space) stop();
			compound();
		}
	}
}
//#endregion
export { checkSelectorNow };
