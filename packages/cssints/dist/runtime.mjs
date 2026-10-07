//#region src/runtime.ts
const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");
function _cv(config) {
	return (props = {}) => {
		const out = [config.base];
		const gone = [];
		const val = {};
		const take = (c, d) => {
			if (c) out.push(c);
			if (c && d) gone.push(...d.split(" "));
		};
		for (const name in config.variants) {
			const v = val[name] = String(props[name] ?? config.defaultVariants[name]);
			take(config.variants[name][v], config.drops?.[name]?.[v]);
		}
		for (const m of config.compound ?? []) if (Object.keys(m.when).every((k) => val[k] === m.when[k])) take(m.class, m.drops);
		return out.join(" ").split(" ").filter((c) => c && !gone.includes(c)).join(" ");
	};
}
//#endregion
export { _cv, cx };
