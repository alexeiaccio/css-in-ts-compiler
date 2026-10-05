//#region src/parent-vars.ts
const families = [];
let started = false;
let observer;
const update = (roots) => {
	for (const f of families) {
		const s = `.${f.marker}`;
		const level = /* @__PURE__ */ new Map();
		const rows = [];
		for (const r of roots) for (const el of r.matches(s) ? [r, ...r.querySelectorAll(s)] : r.querySelectorAll(s)) {
			const p = el.parentElement?.closest(s);
			const l = level.has(p) ? level.get(p) + 1 : 0;
			level.set(el, l);
			(rows[l] ??= []).push([el, p]);
		}
		for (const row of rows) {
			const v = new Map(row.map(([, p]) => [p, p && getComputedStyle(p).getPropertyValue(f.read)]));
			for (const [el, p] of row) if (p) el.style.setProperty(f.write, v.get(p));
			else el.style.removeProperty(f.write);
		}
	}
	observer?.takeRecords();
};
const top = (nodes) => {
	const s = new Set(nodes);
	return [...s].filter((n) => {
		for (let a = n.parentNode; n.isConnected && a; a = a.parentNode) if (s.has(a)) return false;
		return n.isConnected;
	});
};
const start = () => {
	const root = document.documentElement;
	const p = document.createElement("div");
	const c = document.createElement("i");
	const s = document.createElement("style");
	s.textContent = "@container style(--_q:1){i{--_h:1}}";
	p.style.setProperty("--_q", "1");
	p.append(c);
	document.head.append(s);
	root.append(p);
	const supported = getComputedStyle(c).getPropertyValue("--_h");
	p.remove();
	s.remove();
	if (supported) return;
	root.setAttribute("data-cssints-poly", "");
	observer = new MutationObserver((rs) => update(top(rs.flatMap((r) => r.type === "childList" ? [...r.addedNodes].filter((n) => n.nodeType === 1) : [r.target]))));
	observer.observe(root, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["class", "style"]
	});
	for (const type of ["transitionrun", "transitionend"]) document.addEventListener(type, (e) => families.some((f) => f.watch === e.propertyName) && update([e.target]));
};
var parent_vars_default = (add) => {
	if (typeof document === "undefined") return;
	families.push(...add);
	if (!started) {
		started = true;
		start();
	}
	if (observer) update([document.documentElement]);
};
//#endregion
export { parent_vars_default as default };
