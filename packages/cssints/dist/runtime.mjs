//#region src/runtime.ts
const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");
function _cv(config) {
	return (props = {}) => {
		const classes = [config.base];
		const gone = [];
		const use = (name, v) => {
			if (!v || !config.variants[name]?.[v]) return;
			classes.push(config.variants[name][v]);
			const d = config.drops?.[name]?.[v];
			if (d) gone.push(...d.split(" "));
		};
		for (const [name, value] of Object.entries(props)) use(name, value || config.defaultVariants?.[name]);
		for (const [name, v] of Object.entries(config.defaultVariants ?? {})) if (!props[name]) use(name, v);
		if (gone.length) classes[0] = config.base.split(" ").filter((c) => !gone.includes(c)).join(" ");
		return classes.filter(Boolean).join(" ");
	};
}
//#endregion
export { _cv, cx };
