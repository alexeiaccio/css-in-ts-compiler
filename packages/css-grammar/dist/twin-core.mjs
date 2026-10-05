import { InvalidValueError, ParseError, UnknownPropertyError } from "./errors.mjs";
import { properties, syntaxes } from "./mdn.mjs";
//#region src/twin-core.ts
const props = properties;
const syns = syntaxes;
const trim = (s) => s.replace(/^[ \n\t]+/, "");
function next(s) {
	s = trim(s);
	if (s === "") return [{ t: "eof" }, ""];
	let m;
	if (m = /^<'([^']*)'>/.exec(s)) return [{
		t: "prop",
		v: m[1]
	}, s.slice(m[0].length)];
	if (m = /^<([^>]*)>/.exec(s)) {
		const [v, range] = m[1].split(" [");
		const [lo, hi] = range ? range.slice(0, -1).split(",") : [];
		return [{
			t: "type",
			v,
			lo,
			hi
		}, s.slice(m[0].length)];
	}
	if (m = /^'([^']*)'/.exec(s)) return [{
		t: "lit",
		v: m[1]
	}, s.slice(m[0].length)];
	if (m = /^(\|\||&&)/.exec(s)) return [{
		t: "p",
		v: m[1]
	}, s.slice(2)];
	if (m = /^\{([^}]*)\}/.exec(s)) {
		const [lo, hi = lo] = m[1].split(",");
		return [{
			t: "range",
			lo,
			hi: hi || "∞"
		}, s.slice(m[0].length)];
	}
	if (m = /^[[\]()|?*+#!,/;]/.exec(s)) return [{
		t: "p",
		v: m[0]
	}, s.slice(1)];
	if (m = /^[^()[\]|&?*+#!,/{}<>' \n\t]+(?=[ \n\t]|$)/.exec(s)) return [{
		t: "kw",
		v: m[0]
	}, s.slice(m[0].length)];
	const w = /^[A-Za-z0-9_-]*/.exec(s)[0];
	const r = s.slice(w.length);
	if (w === "") return [{ t: "eof" }, ""];
	return r.startsWith("(") ? [{
		t: "fn",
		v: w
	}, r.slice(1)] : [{
		t: "kw",
		v: w
	}, r];
}
const parsed = /* @__PURE__ */ new Map();
let whole = "";
const bad = (message, rest, expected) => new ParseError({
	message,
	grammar: whole,
	position: whole.length - rest.length,
	expected
});
function parseGrammar(s) {
	let n = parsed.get(s);
	if (!n) {
		whole = s;
		parsed.set(s, n = parseAlt(s)[0]);
	}
	return n;
}
const infix = (tag, op, sub) => (s) => {
	const xs = [];
	for (;;) {
		const [n, r] = sub(s);
		xs.push(n);
		const [t, r2] = next(r);
		if (t.t === "p" && t.v === op) s = r2;
		else return [xs.length === 1 ? xs[0] : [tag, xs], r];
	}
};
const parseAlt = infix("alt", "|", infix("or", "||", infix("and", "&&", parseSeq)));
function parseSeq(s) {
	const xs = [];
	for (;;) {
		const [t] = next(s);
		if (t.t === "eof" || t.t === "p" && [
			"|",
			"||",
			"&&",
			"]",
			")"
		].includes(t.v)) return [xs.length === 1 ? xs[0] : ["seq", xs], s];
		const [n, r] = parseTerm(s);
		xs.push(n);
		s = r;
	}
}
function parseTerm(s) {
	const [t, r] = next(s);
	if (t.t === "p" && t.v === "[") {
		const [n, r2] = parseAlt(r);
		const [close, r3] = next(r2);
		if (close.t !== "p" || close.v !== "]") throw bad(`grammar: expected "]" at "${r2}"`, r2, ["\"]\""]);
		return mult(n, r3);
	}
	if (t.t === "fn") return fnArgs(t.v, r);
	if (t.t === "p" && t.v === "(") return fnArgs("", r);
	if (t.t === "type") return mult(t.lo === void 0 ? ["type", t.v] : [
		"type",
		t.v,
		t.lo,
		t.hi
	], r);
	if (t.t === "prop" || t.t === "kw") return mult([t.t, t.v], r);
	if (t.t === "p" && (t.v === "," || t.v === "/" || t.v === ";")) return mult(["lit", t.v], r);
	if (t.t === "lit") return mult(["lit", t.v], r);
	throw bad(`grammar: unexpected token at "${s}"`, s, ["a term"]);
}
function fnArgs(v, s) {
	const [n, r] = parseAlt(s);
	const [close, r2] = next(r);
	if (close.t !== "p" || close.v !== ")") throw bad(`grammar: expected ")" at "${r}"`, r, ["\")\""]);
	return mult([
		"fn",
		v,
		n
	], r2);
}
const dec = (b) => b === "∞" ? b : String(Number(b) - 1);
const MULT = {
	"?": "opt",
	"*": "star",
	"+": "plus",
	"#": "list"
};
function mult(n, s) {
	for (;;) {
		const [t, r] = next(s);
		if (t.t === "p" && MULT[t.v]) n = [MULT[t.v], n];
		else if (t.t === "range") n = n[0] === "list" ? ["seq", [n[1], [
			"rep",
			["seq", [["lit", ","], n[1]]],
			dec(t.lo),
			dec(t.hi)
		]]] : [
			"rep",
			n,
			t.lo,
			t.hi
		];
		else if (t.t === "p" && t.v === "!") n = ["bang", n];
		else return [n, s];
		s = r;
	}
}
function tok1(s) {
	const t = /^[^ ,)]*/.exec(s)[0];
	return [t, s.slice(t.length)];
}
const NUM = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const LENGTH_UNIT = "px|em|rem|vw|vh|vmin|vmax|ch|ex|lh|rlh|cm|mm|in|pt|pc|q|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|ic|cap|rex|rch|ric|rcap";
const re = (s) => new RegExp(`^(?:${s})$`);
const IDENT = String.raw`(?:--|-?[A-Za-z_\u0080-\uffff])[\w\u0080-\uffff-]*`;
const PRIMITIVE = {
	length: re(`${NUM}(?:${LENGTH_UNIT})|0`),
	percentage: re(`${NUM}%`),
	"length-percentage": re(`${NUM}(?:${LENGTH_UNIT})|0|${NUM}%`),
	number: re(NUM),
	integer: re(String.raw`[+-]?\d+`),
	"hex-color": /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
	"custom-ident": new RegExp(`^(?!(?:initial|inherit|unset|revert|revert-layer|default)$)${IDENT}$`, "i"),
	"dashed-ident": /^--.+$/,
	angle: re(`${NUM}(?:deg|rad|grad|turn)`),
	time: re(`${NUM}(?:s|ms)`),
	dimension: re(`${NUM}(?:${LENGTH_UNIT}|deg|rad|grad|turn|s|ms|hz|khz|dpi|dpcm|dppx|x|fr)`),
	resolution: re(`${NUM}(?:dpi|dpcm|dppx|x)`),
	flex: re(`${NUM}fr`),
	zero: re(String.raw`[+-]?(?:0+(?:\.0+)?|\.0+)(?:e[+-]?\d+)?`),
	ident: re(IDENT),
	"ident-token": re(IDENT),
	"hash-token": /^#[\w\u0080-\uffff-]+$/,
	"intrinsic-size-keyword": /^(?:min-content|max-content|fit-content|stretch)$/,
	x: re(NUM),
	y: re(NUM)
};
const STRING = /^(?:"[^"]*"|'[^']*')/;
const URL_RE = /^url\(\s*(?:"[^"]*"|'[^']*'|[^\s"'()\\]*)\s*\)/;
function declarationValue(s) {
	let depth = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (c === "\"" || c === "'") {
			i = s.indexOf(c, i + 1);
			if (i < 0) return -1;
		} else if ("([{".includes(c)) depth++;
		else if (")]}".includes(c)) {
			if (depth) depth--;
			else return c === ")" && i > 0 ? i : -1;
		} else if (!depth && (c === ";" || c === "!")) return -1;
	}
	return depth || !s ? -1 : s.length;
}
const spaced = (q) => q.replace(/[:/]/g, " $& ");
function args(s, sep) {
	const at = [];
	let depth = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (c === "\"" || c === "'") {
			i = s.indexOf(c, i + 1);
			if (i < 0) break;
		} else if ("([{".includes(c)) depth++;
		else if (")]}".includes(c)) {
			if (!depth) return {
				end: c === ")" ? i : -1,
				at
			};
			depth--;
		} else if (c === sep && !depth) at.push(i);
	}
	return {
		end: -1,
		at
	};
}
function ifCall(s) {
	if (!s.startsWith("if(")) return -1;
	const body = s.slice(3);
	const { end, at } = args(body, ";");
	if (end < 0) return -1;
	const cuts = [
		-1,
		...at,
		end
	];
	const branches = cuts.slice(1).map((e, i) => body.slice(cuts[i] + 1, e).trim());
	if (branches.at(-1) === "") branches.pop();
	const branch = (b) => {
		const [i] = args(`${b})`, ":").at;
		if (i === void 0) return false;
		const cond = trim(spaced(b.slice(0, i)));
		const value = b.slice(i + 1).trim();
		const ctx = {
			len: cond.length,
			far: -1,
			expected: /* @__PURE__ */ new Set()
		};
		return consume(parseGrammar(syns["if-condition"]), cond, ctx).has("") && (value === "" || declarationValue(value) === value.length);
	};
	return branches.length && branches.every(branch) ? end + 4 : -1;
}
function calcSum(s, ctx) {
	const [t, end] = mathScan(s, void 0, true);
	if (t && fits(t, KIND["length-percentage"])) return end;
	ctx.why = [ctx.len - s.length, t ? `${s.slice(0, end)} is ${typeName(t)}, not <length-percentage>` : why];
	return -1;
}
const SCAN = {
	string: (s) => STRING.exec(s)?.[0].length ?? -1,
	url: (s) => URL_RE.exec(s)?.[0].length ?? -1,
	"declaration-value": declarationValue,
	"if()": ifCall,
	"calc-sum": calcSum
};
const isNative = (name) => !!(PRIMITIVE[name] || SCAN[name]);
const RGB = [
	"r",
	"g",
	"b",
	"alpha"
];
const HSL = [
	"h",
	"s",
	"l",
	"alpha"
];
const LAB = [
	"l",
	"a",
	"b",
	"alpha"
];
const LCH = [
	"l",
	"c",
	"h",
	"alpha"
];
const CHANNELS = /* @__PURE__ */ new Map([
	["rgb", RGB],
	["rgba", RGB],
	["hsl", HSL],
	["hsla", HSL],
	["hwb", [
		"h",
		"w",
		"b",
		"alpha"
	]],
	["lab", LAB],
	["oklab", LAB],
	["lch", LCH],
	["oklch", LCH],
	["color", ["alpha"]]
]);
const SPACES = new Map([...syns["predefined-rgb"].split(" | ").map((k) => [k, [
	"r",
	"g",
	"b"
]]), ...syns["xyz-space"].split(" | ").map((k) => [k, [
	"x",
	"y",
	"z"
]])]);
function spaceChannels(body) {
	let b = body.slice(0, args(body, "").end);
	for (let p = ""; p !== b;) [p, b] = [b, b.replace(/\([^()]*\)/g, "")];
	return b.split(/\s+/).map((k) => SPACES.get(k)).find(Boolean) ?? [];
}
const PENDING = /(?:var|env|if)\(/;
const ENV = /^env\([ \n\t]*[A-Za-z_-][\w-]*/;
function pendingEnd(s) {
	if (!/^(?:var|env|if)\(/.test(s)) return -1;
	if (s[0] === "i") return ifCall(s);
	const { end } = args(s.slice(4), "");
	if (end < 0) return -1;
	const call = s.slice(0, end + 5);
	return (s[0] === "v" ? matches(syns["var()"], call) : ENV.test(call)) ? end + 5 : -1;
}
function skipPending(s) {
	for (let e; (e = pendingEnd(s)) >= 0;) s = trim(s.slice(e));
	return s;
}
function pend(n, s, ctx, label) {
	const e = pendingEnd(s);
	if (e < 0) return NONE;
	const rest = trim(s.slice(e));
	return /* @__PURE__ */ new Set([
		s,
		rest,
		...consume(n, rest, ctx, label)
	]);
}
const complete = (rs, ctx) => ctx.pend ? [...rs].some((r) => skipPending(r) === "") : rs.has("");
function wrongCase(ctx, s, t, name, call = "") {
	if (t.length === name.length && t !== name && t.toLowerCase() === name.toLowerCase()) ctx.fix = [
		ctx.len - s.length,
		t + call,
		name + call
	];
}
function fail(ctx, s, what) {
	const at = ctx.len - s.length;
	if (at > ctx.far) {
		ctx.far = at;
		ctx.expected = /* @__PURE__ */ new Set();
	}
	if (at === ctx.far) ctx.expected.add(what);
}
const NONE = /* @__PURE__ */ new Set();
const union = (sets) => {
	const out = /* @__PURE__ */ new Set();
	for (const s of sets) for (const r of s) out.add(r);
	return out;
};
const flatMap = (rs, f) => union([...rs].map(f));
function consume(n, s, ctx, label) {
	const leaf = (ok, rest, what) => ok ? /* @__PURE__ */ new Set([trim(rest)]) : (fail(ctx, s, label ?? what), ctx.pend ? pend(n, s, ctx, label) : NONE);
	const sub = (x, r) => consume(x, r, ctx, label);
	switch (n[0]) {
		case "kw": {
			const [t, r] = tok1(s);
			if (t !== n[1]) wrongCase(ctx, s, t, n[1]);
			return leaf(t === n[1], r, n[1]);
		}
		case "lit": return leaf(s.startsWith(n[1]), s.slice(n[1].length), `'${n[1]}'`);
		case "type": return consumeType(n, s, ctx, label);
		case "prop": {
			const g = props[n[1]];
			return g ? consume(parseGrammar(g), s, ctx, label ?? `<'${n[1]}'>`) : leaf(false, s, `<'${n[1]}'>`);
		}
		case "fn": {
			if (!s.startsWith(`${n[1]}(`)) {
				if (n[1] && s[n[1].length] === "(") wrongCase(ctx, s, s.slice(0, n[1].length), n[1], "()");
				return leaf(false, s, `${n[1]}()`);
			}
			const body = trim(s.slice(n[1].length + 1));
			const outer = ctx.ch;
			if (n[1]) {
				const ch = /^from[ \n\t]/.test(body) ? CHANNELS.get(n[1]) : void 0;
				ctx.ch = ch && n[1] === "color" ? [...ch, ...spaceChannels(body)] : ch;
			}
			const rs = flatMap(sub(n[2], body), (r0) => {
				const r = ctx.pend ? skipPending(r0) : r0;
				return r.startsWith(")") ? /* @__PURE__ */ new Set([trim(r.slice(1))]) : (fail(ctx, r0, label ?? "')'"), NONE);
			});
			ctx.ch = outer;
			return rs;
		}
		case "alt": return union(n[1].map((x) => sub(x, s)));
		case "seq": return seq(n[1], s, sub);
		case "opt": return /* @__PURE__ */ new Set([s, ...sub(n[1], s)]);
		case "star": return closure(/* @__PURE__ */ new Set([s]), (r) => sub(n[1], r));
		case "plus": return closure(sub(n[1], s), (r) => sub(n[1], r));
		case "list": return closure(sub(n[1], s), (r) => {
			if (r.startsWith(",")) return sub(n[1], trim(r.slice(1)));
			const e = ctx.pend ? pendingEnd(r) : -1;
			return e < 0 ? NONE : union([sub(n[1], r), sub(n[1], trim(r.slice(e)))]);
		});
		case "rep": return rep(s, Number(n[2]), n[3] === "∞" ? Infinity : Number(n[3]), (r) => sub(n[1], r));
		case "bang": {
			const rs = new Set([...sub(n[1], s)].filter((r) => r !== s));
			if (!rs.size) fail(ctx, s, label ?? "a non-empty group");
			return rs;
		}
		case "or": return anyOrder(n[1], s, false, sub, ctx.pend);
		case "and": return anyOrder(n[1], s, true, sub, ctx.pend);
	}
}
const SCALE = {
	grad: .9,
	rad: 180 / Math.PI,
	turn: 360,
	ms: .001
};
const NUM_HEAD = new RegExp(`^${NUM}`, "i");
const magnitude = (t) => t === "∞" ? Infinity : t === "-∞" ? -Infinity : parseFloat(t) * (SCALE[t.replace(NUM_HEAD, "").trim().toLowerCase()] ?? 1);
const NUMBER = { e: {} };
const ANY = {
	e: {},
	any: true
};
const dim = (k) => ({ e: { [k]: 1 } });
const bases = (t) => Object.keys(t.e);
const plain = (t) => bases(t).length === 1 && t.e[bases(t)[0]] === 1;
const same = (a, b) => bases(a).length === bases(b).length && bases(a).every((k) => a.e[k] === b.e[k]);
const isNumber = (t) => t.any || !t.mix && !bases(t).length;
const typeName = (t) => t.any ? "anything" : `${bases(t).map((k) => `${k === "percent" ? "percentage" : k}${t.e[k] === 1 ? "" : `^${t.e[k]}`}`).join(" * ")}${t.mix ? "-percentage" : ""}` || "number";
function add(a, b) {
	if (a.any || b.any) return ANY;
	if (same(a, b)) return {
		e: a.e,
		mix: a.mix || b.mix
	};
	const pct = (t) => same(t, dim("percent")) && !t.mix;
	if (pct(a) && plain(b)) return {
		e: b.e,
		mix: true
	};
	if (pct(b) && plain(a)) return {
		e: a.e,
		mix: true
	};
}
function mul(a, b, sign) {
	if (a.any || b.any) return ANY;
	const e = { ...a.e };
	for (const k in b.e) if (!(e[k] = (e[k] ?? 0) + sign * b.e[k])) delete e[k];
	return {
		e,
		mix: a.mix || b.mix
	};
}
const KIND = {
	number: ["", false],
	integer: ["", false],
	x: ["", false],
	y: ["", false],
	length: ["length", false],
	percentage: ["percent", false],
	"length-percentage": ["length", true],
	angle: ["angle", false],
	"angle-percentage": ["angle", true],
	time: ["time", false],
	resolution: ["resolution", false]
};
const fits = (t, [k, pct]) => t.any || (t.mix ? pct && plain(t) && t.e[k] === 1 : k === "" ? !bases(t).length : plain(t) && (t.e[k] === 1 || pct && t.e.percent === 1));
const MATH = new Set("calc min max clamp round mod rem sin cos tan asin acos atan atan2 pow sqrt hypot log exp abs sign".split(" "));
const MATH_START = new RegExp(`^(?:${[...MATH].join("|")})\\(`);
const UNITS = new Map([
	...LENGTH_UNIT.split("|").map((u) => [u, "length"]),
	...[
		"deg",
		"rad",
		"grad",
		"turn"
	].map((u) => [u, "angle"]),
	...["s", "ms"].map((u) => [u, "time"]),
	...[
		"dpi",
		"dpcm",
		"dppx",
		"x"
	].map((u) => [u, "resolution"])
]);
const sticky = (r) => new RegExp(r, "iy");
const NUM_TOKEN = sticky(NUM);
const UNIT_TOKEN = /%|[A-Za-z]+/y;
const WORD = /-?[A-Za-z][\w-]*/y;
const WS = /[ \n\t]*/y;
const ROUND_MODE = /(?:nearest|up|down|to-zero)(?=[ \n\t]*,)/y;
const NONE_WORD = /none(?![\w-])/y;
let why = "";
function mathScan(s, ch, sumOnly) {
	let i = 0;
	const tok = (r) => {
		r.lastIndex = i;
		const m = r.exec(s);
		if (m) i = r.lastIndex;
		return m?.[0];
	};
	const ws = () => void tok(WS);
	const no = (m) => (why ||= m, void 0);
	function sum() {
		let a = product();
		for (;;) {
			const at = i;
			ws();
			const op = s[i];
			if (!a || op !== "+" && op !== "-" || i === at || !/[ \n\t]/.test(s[i + 1] ?? "")) {
				i = at;
				return a;
			}
			i++;
			ws();
			const b = product();
			if (!b) return void 0;
			a = add(a, b) ?? no(`cannot ${op === "+" ? "add" : "subtract"} ${typeName(a)} and ${typeName(b)}`);
		}
	}
	function product() {
		let a = value();
		for (;;) {
			const at = i;
			ws();
			const op = s[i];
			if (!a || op !== "*" && op !== "/") {
				i = at;
				return a;
			}
			i++;
			ws();
			const b = value();
			if (!b) return void 0;
			a = mul(a, b, op === "*" ? 1 : -1);
		}
	}
	function value() {
		if (s[i] === "(") {
			i++;
			ws();
			const t = sum();
			ws();
			if (!t) return void 0;
			if (s[i] !== ")") return no("expected \")\"");
			i++;
			return t;
		}
		if (tok(NUM_TOKEN) !== void 0) {
			const u = tok(UNIT_TOKEN);
			if (u === void 0) return NUMBER;
			const k = u === "%" ? "percent" : UNITS.get(u);
			return k ? dim(k) : no(`unknown unit "${u}"`);
		}
		const w = tok(WORD);
		if (w === void 0) return no("expected a number, a dimension or a function");
		if (s[i] === "(") return call(w, i++);
		return /^(?:-?infinity|e|pi|nan)$/i.test(w) || ch?.includes(w.toLowerCase()) ? NUMBER : no(`unknown "${w}"`);
	}
	function call(name, open) {
		if (name === "var" || name === "env") {
			const { end } = args(s.slice(i), "");
			if (end < 0) return no(`${name}() is not closed`);
			i += end + 1;
			return name === "env" || matches(syns["var()"], s.slice(open - 3, i)) ? ANY : no("not a var()");
		}
		if (!MATH.has(name)) return no(`${name}() is not a math function`);
		const ts = [];
		for (let mode = name === "round";;) {
			ws();
			if (mode && tok(ROUND_MODE) !== void 0) mode = false;
			else {
				mode = false;
				const t = name === "clamp" && tok(NONE_WORD) !== void 0 ? "none" : sum();
				if (!t) return void 0;
				ts.push(t);
			}
			ws();
			if (s[i] === ",") i++;
			else if (s[i] === ")") break;
			else return no(i >= s.length ? `${name}() is not closed` : "expected \",\" or \")\"");
		}
		i++;
		const n = ts.length;
		const cs = ts.filter((t) => t !== "none");
		const [a, b] = cs;
		const arity = (lo, hi = lo) => n >= lo && n <= hi ? true : (no(`${name}() takes ${lo === hi ? lo : `${lo} to ${hi}`} arguments`), false);
		const fold = () => cs.reduce((x, y) => x && (add(x, y) ?? no(`${name}() cannot take ${typeName(x)} and ${typeName(y)}`)), a);
		const numbers = (r) => cs.every(isNumber) ? r : no(`${name}() takes numbers, not ${typeName(cs.find((t) => !isNumber(t)))}`);
		switch (name) {
			case "calc":
			case "abs": return arity(1) ? a : void 0;
			case "min":
			case "max":
			case "hypot": return arity(1, Infinity) ? fold() : void 0;
			case "clamp": return arity(3) ? ts[1] === "none" ? no("clamp() needs a value in the middle") : fold() : void 0;
			case "round": return n === 1 && isNumber(a) ? a : arity(2) ? fold() : void 0;
			case "mod":
			case "rem": return arity(2) ? fold() : void 0;
			case "sign": return arity(1) ? NUMBER : void 0;
			case "sin":
			case "cos":
			case "tan": return arity(1) ? isNumber(a) || same(a, dim("angle")) ? NUMBER : no(`${name}() takes a number or an angle, not ${typeName(a)}`) : void 0;
			case "asin":
			case "acos":
			case "atan": return arity(1) ? numbers(dim("angle")) : void 0;
			case "sqrt":
			case "exp": return arity(1) ? numbers(NUMBER) : void 0;
			case "pow": return arity(2) ? numbers(NUMBER) : void 0;
			case "log": return arity(1, 2) ? numbers(NUMBER) : void 0;
			default: return arity(2) ? a.any || b.any || same(a, b) && !a.mix && !b.mix ? dim("angle") : no(`atan2() cannot take ${typeName(a)} and ${typeName(b)}`) : void 0;
		}
	}
	why = "";
	return [sumOnly ? sum() : value(), i];
}
function mathValue(v, s, t, r, ctx) {
	const kind = KIND[v];
	if (!kind) return NONE;
	if (ctx.ch && (v === "number" || v === "percentage" || v === "angle")) {
		if (v === "number" && ctx.ch.includes(t.toLowerCase())) return /* @__PURE__ */ new Set([trim(r)]);
		if (s.startsWith("var(")) return consumeType(["type", "var()"], s, ctx);
	}
	if (!t.includes("(") || !MATH_START.test(t)) return NONE;
	const [ty, end] = mathScan(s, ctx.ch, false);
	if (ty && fits(ty, kind)) return /* @__PURE__ */ new Set([trim(s.slice(end))]);
	ctx.why = [ctx.len - s.length, ty ? `${s.slice(0, end)} is ${typeName(ty)}, not <${v}>` : why];
	return NONE;
}
function consumeType([, v, lo, hi], s, ctx, label) {
	let rs;
	if (PRIMITIVE[v]) {
		const [t, r] = tok1(s);
		rs = PRIMITIVE[v].test(t) ? /* @__PURE__ */ new Set([trim(r)]) : mathValue(v, s, t, r, ctx);
	} else if (SCAN[v]) {
		const n = SCAN[v](s, ctx);
		rs = n < 0 ? NONE : /* @__PURE__ */ new Set([trim(s.slice(n))]);
	} else if (syns[v]) {
		const f = v.endsWith("()") ? v.slice(0, -2) : void 0;
		if (f !== void 0 && !s.startsWith(`${f}(`)) {
			if (s[f.length] === "(") wrongCase(ctx, s, s.slice(0, f.length), f, "()");
			rs = NONE;
		} else rs = consume(parseGrammar(syns[v]), s, ctx, label ?? `<${v}>`);
		if (v === "angle-percentage") {
			const m = mathValue(v, s, ...tok1(s), ctx);
			if (m !== NONE) rs = union([rs, m]);
		}
	} else rs = NONE;
	if (rs === NONE) {
		fail(ctx, s, label ?? `<${v}>`);
		if (ctx.pend && (PRIMITIVE[v] || SCAN[v] || v.endsWith("()"))) return pend([
			"type",
			v,
			lo,
			hi
		], s, ctx, label);
	}
	if (lo === void 0 || hi === void 0) return rs;
	const out = /* @__PURE__ */ new Set();
	for (const r of rs) {
		const x = magnitude(s.slice(0, s.length - r.length));
		if (Number.isNaN(x) || x >= magnitude(lo) && x <= magnitude(hi)) out.add(r);
		else fail(ctx, s, `<${v} [${lo},${hi}]>`);
	}
	return out;
}
const nullable = (n) => n[0] === "opt" || n[0] === "star" || n[0] === "rep" && n[2] === "0";
function seq(xs, s, sub) {
	let rs = /* @__PURE__ */ new Set([s]), start = NONE, moved = NONE;
	const done = /* @__PURE__ */ new Set();
	xs.forEach((x, i) => {
		if (x[0] !== "lit" || x[1] !== ",") {
			if (start === NONE) start = rs;
			rs = flatMap(rs, (r) => sub(x, r));
			return;
		}
		const go = new Set([...rs].filter((r) => !start.has(r)));
		const after = flatMap(go, (r) => sub(x, r));
		const rest = xs.slice(i + 1);
		if (rest.length && rest.every(nullable)) {
			go.forEach((r) => done.add(r));
			moved = after;
		}
		rs = start = new Set([...rs].filter((r) => start.has(r)).concat(...after));
	});
	return new Set([...rs].filter((r) => !moved.has(r)).concat(...done));
}
function closure(rs, step) {
	const all = new Set(rs);
	for (let todo = [...rs]; todo.length;) {
		const fresh = [];
		for (const r of todo) for (const q of step(r)) if (!all.has(q)) {
			all.add(q);
			fresh.push(q);
		}
		todo = fresh;
	}
	return all;
}
function rep(s, lo, hi, step) {
	const out = /* @__PURE__ */ new Set();
	let cur = /* @__PURE__ */ new Set([s]);
	for (let i = 0;; i++) {
		if (i >= lo) {
			const before = out.size;
			for (const r of cur) out.add(r);
			if (i > lo && out.size === before) return out;
		}
		if (i === hi || cur.size === 0) return out;
		cur = flatMap(cur, step);
	}
}
function anyOrder(xs, s, all, sub, pend = false) {
	if (!xs.length) return /* @__PURE__ */ new Set([s]);
	const e = pend ? pendingEnd(s) : -1;
	const q = e < 0 ? s : trim(s.slice(e));
	const out = e < 0 ? /* @__PURE__ */ new Set() : union([/* @__PURE__ */ new Set([s, q]), anyOrder(xs, q, false, sub, pend)]);
	xs.forEach((x, i) => {
		for (const r1 of sub(x, s)) {
			if (e >= 0 && (r1 === s || r1 === q)) continue;
			if (!all || e >= 0) out.add(r1);
			for (const r of anyOrder(xs.filter((_, j) => j !== i), r1, all && e < 0, sub, pend)) out.add(r);
		}
	});
	return out;
}
function matches(syntax, s, pending = false) {
	const v = trim(s);
	const ctx = {
		len: v.length,
		far: -1,
		expected: /* @__PURE__ */ new Set(),
		pend: pending && PENDING.test(v)
	};
	return complete(consume(parseGrammar(syntax), v, ctx), ctx);
}
const CSS_WIDE_VALUES = /* @__PURE__ */ new Set([
	"inherit",
	"initial",
	"unset",
	"revert",
	"revert-layer"
]);
function valid(p, s, syntax = props[p]) {
	if (!syntax) throw new UnknownPropertyError({
		message: `${p}: no grammar for this property`,
		property: p
	});
	const v = trim(s);
	if (CSS_WIDE_VALUES.has(v)) return s;
	const ctx = {
		len: v.length,
		far: -1,
		expected: /* @__PURE__ */ new Set(),
		pend: PENDING.test(v)
	};
	const rs = consume(parseGrammar(syntax), v, ctx);
	if (complete(rs, ctx)) return s;
	for (const r of rs) fail(ctx, r, "end of value");
	const [token] = tok1(v.slice(ctx.far));
	const what = token ? `unexpected "${token}"` : "unexpected end";
	const expected = [...ctx.expected];
	const fix = ctx.fix?.[0] === ctx.far ? ` ("${ctx.fix[1]}" is ${ctx.fix[2]} in CSS; write "${ctx.fix[2]}")` : "";
	throw new InvalidValueError({
		message: `${p}: ${what} in "${s}"${fix}, expected ${expected.join(" | ")}${ctx.why?.[0] === ctx.far ? ` (${ctx.why[1]})` : ""}`,
		property: p,
		value: s,
		position: ctx.far + (s.length - v.length),
		expected
	});
}
//#endregion
export { consume, isNative, magnitude, matches, next, nullable, parseGrammar, spaced, valid };
