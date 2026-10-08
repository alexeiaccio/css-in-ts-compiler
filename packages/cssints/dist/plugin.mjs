//#region src/scope.ts
/** `arg<T>()`: one value of the TypeScript type `T`. */
const arg = () => ({ "~arg": 1 });
/**
* A value member whose `args` is a tuple or `arg<T>()`: `value` gets the arguments as a call member's `build` does. A
* table cannot type `value` from the `args` beside it (as `build()` does for call members); this call can.
*/
const fn = (def) => def;
/** The engine, once the library is loaded (the prepended import of every module with sites loads it before any plugin module runs). */
const engine = () => {
	const e = globalThis.__cssints?.engine;
	if (!e) throw new Error("cssints: the plugin helpers run at build time, once the cssints library is loaded");
	return e;
};
function scope(name, table) {
	return engine().scope(name, table);
}
//#endregion
export { arg, fn, scope };
