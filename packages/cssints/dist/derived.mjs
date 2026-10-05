//#region src/derived.ts
/** The custom property of :root that carries the data (derived-data.ts writes it). */
const KEY = "--_derived";
const mul = (m, v) => [
	0,
	3,
	6
].map((r) => v.reduce((s, x, k) => s + m[r + k] * x, 0));
const lin = (c) => {
	const a = Math.abs(c);
	return (a <= .04045 ? a / 12.92 : ((a + .055) / 1.055) ** 2.4) * Math.sign(c);
};
const gam = (c) => {
	const a = Math.abs(c);
	return (a <= .0031308 ? a * 12.92 : 1.055 * a ** (1 / 2.4) - .055) * Math.sign(c);
};
const rad = Math.PI / 180;
const rect = ([l, c, h]) => [
	l,
	c * Math.cos(h * rad),
	c * Math.sin(h * rad)
];
const polar = ([l, a, b]) => {
	const h = Math.atan2(b, a) / rad;
	return [
		l,
		Math.hypot(a, b),
		h < 0 ? h + 360 : h
	];
};
const LMS = [
	.4122214708,
	.5363325363,
	.0514459929,
	.2119034982,
	.6806995451,
	.1073969566,
	.0883024619,
	.2817188376,
	.6299787005
];
const OK = [
	.2104542553,
	.793617785,
	-.0040720468,
	1.9779984951,
	-2.428592205,
	.4505937099,
	.0259040371,
	.7827717662,
	-.808675766
];
const LMS_I = [
	4.0767416621,
	-3.3077115913,
	.2309699292,
	-1.2684380046,
	2.6097574011,
	-.3413193965,
	-.0041960863,
	-.7034186147,
	1.707614701
];
const OK_I = [
	1,
	.3963377774,
	.2158037573,
	1,
	-.1055613458,
	-.0638541728,
	1,
	-.0894841775,
	-1.291485548
];
const XYZ = [
	.436065743,
	.385151469,
	.143078454,
	.222493192,
	.716887054,
	.0606197905,
	.0139239045,
	.0970812857,
	.714099358
];
const XYZ_I = [
	3.13413576,
	-1.61738568,
	-.49066242,
	-.978795456,
	1.91625419,
	.0334429841,
	.071955413,
	-.228976675,
	1.40538601
];
const D50 = [
	.9642956764295677,
	1,
	.8251046025104602
];
const E = 216 / 24389;
const K = 24389 / 27;
const to = {
	"srgb-linear": (c) => c,
	srgb: (c) => c.map(lin),
	oklab: (c) => mul(LMS_I, mul(OK_I, c).map((v) => v ** 3)),
	oklch: (c) => to.oklab(rect(c)),
	lab: ([l, a, b]) => {
		const y = (l + 16) / 116;
		const f = [
			a / 500 + y,
			y,
			y - b / 200
		];
		return mul(XYZ_I, f.map((v, i) => D50[i] * (v ** 3 > E ? v ** 3 : (116 * v - 16) / K)));
	}
};
const from = {
	"srgb-linear": (c) => c,
	srgb: (c) => c.map(gam),
	oklab: (c) => mul(OK, mul(LMS, c).map(Math.cbrt)),
	oklch: (c) => polar(from.oklab(c)),
	lab: (c) => {
		const f = mul(XYZ, c).map((v, i) => {
			const x = v / D50[i];
			return x > E ? Math.cbrt(x) : (K * x + 16) / 116;
		});
		return [
			116 * f[1] - 16,
			500 * (f[0] - f[1]),
			200 * (f[1] - f[2])
		];
	}
};
const conv = (c, s) => c.s === s ? c : {
	s,
	c: from[s](to[c.s](c.c)),
	a: c.a
};
const SPEC = {
	srgb: ["rgb", [
		1,
		1,
		1
	]],
	"srgb-linear": ["rgb", [
		1,
		1,
		1
	]],
	oklab: ["lab", [
		1,
		.4,
		.4
	]],
	oklch: ["lch", [
		1,
		.4,
		360
	]],
	lab: ["lab", [
		100,
		125,
		125
	]]
};
const NAMED = {
	black: "#000",
	white: "#fff",
	transparent: "#0000"
};
const TOKEN = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|deg)?|#\w+|(?:--|-?)[a-z_][\w-]*|[^\s]/gi;
const fail = (x) => {
	throw new Error(x);
};
const hex = (x) => {
	const h = x.slice(1);
	if (![
		3,
		4,
		6,
		8
	].includes(h.length) || /[^\da-f]/i.test(h)) return fail(x);
	const n = h.length < 5 ? h.replace(/./g, "$&$&") : h;
	const byte = (i) => parseInt(n.slice(i, i + 2), 16) / 255;
	return {
		s: "srgb",
		c: [
			byte(0),
			byte(2),
			byte(4)
		],
		a: n.length > 6 ? byte(6) : 1
	};
};
const evaluate = (text, get = (n) => fail(n)) => {
	const t = text.match(TOKEN) ?? [];
	let i = 0;
	let pct = 1;
	let env = {};
	const next = () => t[i++] ?? fail(t[i - 2]);
	const want = (s) => {
		if (next() !== s) fail(t[i - 1]);
	};
	const input = () => {
		want("(");
		const v = get(next());
		want(")");
		return v;
	};
	const list = () => {
		want("(");
		const out = [sum()];
		while (t[i] === ",") {
			i++;
			out.push(sum());
		}
		want(")");
		return out;
	};
	const atom = () => {
		const x = next();
		if (/^[+-]?[\d.]/.test(x)) return parseFloat(x) * (x.endsWith("%") ? pct / 100 : 1);
		if (x === "(") {
			const v = sum();
			want(")");
			return v;
		}
		if (x === "calc") return atom();
		if (x === "-") return -atom();
		if (x === "clamp") {
			const [lo, v, hi] = list();
			return Math.max(lo, Math.min(v, hi));
		}
		if (x === "min") return Math.min(...list());
		if (x === "max") return Math.max(...list());
		if (x === "var") {
			const v = input();
			return typeof v === "string" && v ? Number(v) : fail(x);
		}
		if (x === "none") return 0;
		return Object.hasOwn(env, x) ? env[x] : fail(x);
	};
	const prod = () => {
		let v = atom();
		for (let o = t[i]; o === "*" || o === "/"; o = t[i]) {
			i++;
			v = o === "*" ? v * atom() : v / atom();
		}
		return v;
	};
	const sum = () => {
		let v = prod();
		for (let o = t[i]; o === "+" || o === "-"; o = t[i]) {
			i++;
			v += o === "+" ? prod() : -prod();
		}
		return v;
	};
	const fn = (f) => {
		want("(");
		const origin = t[i] === "from" ? (i++, col()) : void 0;
		const space = f === "color" ? next() : f === "rgb" || f === "rgba" ? "srgb" : f;
		if (!Object.hasOwn(SPEC, space)) return fail(f === "color" ? space : f);
		const [names, base] = SPEC[space];
		const k = f[0] === "r" ? 255 : 1;
		const src = origin && conv(origin, space);
		env = src ? {
			alpha: src.a,
			...Object.fromEntries([...names].map((n, j) => [n, src.c[j] * k]))
		} : {};
		const c = base.map((b, j) => {
			if (j && t[i] === ",") i++;
			pct = b * k;
			return atom() / k;
		});
		let a = 1;
		if (t[i] === "/" || t[i] === ",") {
			i++;
			pct = 1;
			a = Math.min(1, Math.max(0, atom()));
		}
		want(")");
		return {
			s: space,
			c,
			a
		};
	};
	const mix = () => {
		want("(");
		want("in");
		const s = next();
		if (s === "oklch" || !Object.hasOwn(SPEC, s)) return fail(s);
		want(",");
		const one = () => {
			return [conv(col(), s), t[i]?.endsWith("%") ? parseFloat(next()) : void 0];
		};
		const [a, p] = one();
		want(",");
		const [b, q] = one();
		want(")");
		const x = p ?? 100 - (q ?? 50);
		const y = q ?? 100 - x;
		if (x + y !== 100) return fail("color-mix");
		const al = (a.a * x + b.a * y) / 100;
		return {
			s,
			c: a.c.map((v, j) => al ? (v * a.a * x + b.c[j] * b.a * y) / 100 / al : 0),
			a: al
		};
	};
	const col = () => {
		const x = next();
		if (x.startsWith("#")) return hex(x);
		if (NAMED[x]) return hex(NAMED[x]);
		if (x === "var") {
			const v = input();
			return typeof v === "string" ? evaluate(v, get) : v;
		}
		return x === "color-mix" ? mix() : fn(x);
	};
	const out = col();
	if (i < t.length) fail(t[i]);
	return out;
};
const css = (c) => {
	const [r, g, b] = conv(c, "srgb").c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));
	return `rgb(${r} ${g} ${b}${c.a < 1 ? ` / ${+c.a.toFixed(3)}` : ""})`;
};
var derived_default = () => {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	const cs = getComputedStyle(root);
	const written = /* @__PURE__ */ new Map();
	let observer;
	let raw = "";
	let data;
	let names;
	const read = () => {
		const v = cs.getPropertyValue(KEY).trim();
		if (!v || v === raw) return !!v;
		raw = v;
		data = JSON.parse(v.slice(1, -1).replace(/\\(.)/g, "$1"));
		names = [.../* @__PURE__ */ new Set([...Object.keys(data.b), ...data.t.flatMap(([, x]) => Object.keys(x))])];
		return true;
	};
	const update = () => {
		read();
		const tpl = new Map(Object.entries(data.b));
		for (const [cond, v] of data.t) if (cond.startsWith("@") ? matchMedia(cond.slice(6)).matches : root.matches(cond)) for (const n in v) if (v[n]) tpl.set(n, v[n]);
		else tpl.delete(n);
		for (const n of names) if (!tpl.has(n) && written.delete(n)) root.style.removeProperty(n);
		const done = /* @__PURE__ */ new Map();
		const get = (n) => {
			let v = done.get(n);
			if (v === void 0) {
				const t = tpl.get(n);
				done.set(n, v = t === void 0 ? cs.getPropertyValue(n).trim() || fail(n) : evaluate(t, get));
			}
			return v;
		};
		const next = [...tpl.keys()].map((n) => {
			try {
				return [n, css(get(n))];
			} catch {
				return [n, void 0];
			}
		});
		for (const [n, v] of next) if (v === void 0) {
			if (written.delete(n)) root.style.removeProperty(n);
		} else if (written.get(n) !== v) {
			written.set(n, v);
			root.style.setProperty(n, v);
		}
		observer.takeRecords();
	};
	const go = () => {
		if (!read()) return false;
		if (data.p.every((p) => CSS.supports("color", p))) return true;
		observer = new MutationObserver(update);
		observer.observe(root, { attributes: true });
		for (const [cond] of data.t) if (cond.startsWith("@")) matchMedia(cond.slice(6)).addEventListener("change", update);
		update();
		return true;
	};
	if (!go()) addEventListener("load", go, { once: true });
};
//#endregion
export { KEY, css, derived_default as default, evaluate };
