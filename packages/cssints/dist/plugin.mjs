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
/**
* The build's targets that lack one of the BCD keys, as browserslist names them (`["firefox 140"]`), by the rules of the
* support warnings (`partial_implementation` lacks); empty when every target has them all. Build time, like `scope()`.
*/
const lacking = (...keys) => engine().lacking(keys);
/**
* Tells the engine that the module being evaluated read the file at `path` (relative to the working directory): in dev, an
* edit of the file runs that module again, as an edit of a module it imports does; in `vite build --watch`, it is a watched
* file. Build time, like `scope()`: in a member's functions or in the plugin's own.
*/
const dependsOn = (path) => engine().dependsOn(path);
/**
* Whether a declaration is in an export group (`cssints/widely-available`, `baseline-2022/with-downstream`, ...): the group
* has the property and the value holds no word the group bans. A property cssints has no member for (a custom property, a
* vendor-prefixed one) is in every group. A plugin that has a variant per group emits only what passes. Build time, like
* `scope()`; an unknown group is an error.
*/
const inGroup = (group, property, value) => engine().inGroup(group, property, value);
//#endregion
export { arg, dependsOn, fn, inGroup, lacking, scope };
