import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { convertParsedSVG, getIconData, iconToHTML, iconToSVG, parseSVGContent, svgToURL } from "@iconify/utils";
import { arg, scope } from "cssints/plugin";
//#region src/index.ts
const box = "display:inline-block;width:1em;height:1em";
const mask = { css: `&{${box};background-color:currentColor;mask:var(--_svg) no-repeat center/100% 100%}` };
const image = { css: `&{${box};background:var(--_svg) no-repeat center/100% 100%}` };
const distance = (a, b) => {
	let row = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const next = [i];
		for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		row = next;
	}
	return row[b.length];
};
const nearest = (name, names) => {
	const near = Math.max(2, name.length >> 1);
	let best;
	let least = near + 1;
	for (const n of names) {
		const d = distance(name, n);
		if (d < least) [best, least] = [n, d];
	}
	return best;
};
const g = globalThis;
const iconify = (collection) => {
	const pkg = `@iconify-json/${collection}/icons.json`;
	let json;
	try {
		const file = createRequire(join(process.cwd(), "_")).resolve(pkg);
		const mtime = statSync(file).mtimeMs;
		const cache = g.__cssintsIcons ??= /* @__PURE__ */ new Map();
		const hit = cache.get(file);
		json = hit?.mtime === mtime ? hit.json : JSON.parse(readFileSync(file, "utf8"));
		cache.set(file, {
			mtime,
			json
		});
	} catch (e) {
		throw new Error(`cssints: icons: cannot read ${pkg} from ${process.cwd()}: install @iconify-json/${collection}`, { cause: e });
	}
	return {
		label: `iconify-json ${collection}`,
		get: (name) => getIconData(json, name) ?? void 0,
		names: () => [...Object.keys(json.icons), ...Object.keys(json.aliases ?? {})]
	};
};
const files = (dir) => {
	const abs = resolve(dir);
	const list = () => {
		try {
			return readdirSync(abs).filter((f) => f.endsWith(".svg"));
		} catch (e) {
			throw new Error(`cssints: icons: cannot read the directory ${abs}`, { cause: e });
		}
	};
	list();
	return {
		label: dir,
		names: () => list().map((f) => f.slice(0, -4)),
		get: (name) => {
			if (!list().includes(`${name}.svg`)) return void 0;
			const svg = parseSVGContent(readFileSync(join(abs, `${name}.svg`), "utf8"));
			const icon = svg && convertParsedSVG(svg);
			if (!icon) throw new Error(`cssints: icons: ${name}.svg is not an SVG with a viewBox`);
			return icon;
		}
	};
};
const urlOf = (icon) => {
	const { body, viewBox } = iconToSVG(icon);
	const [x, y, w, h] = viewBox;
	const side = Math.max(w, h);
	return svgToURL(iconToHTML(body.replace(/currentColor/g, "black"), {
		viewBox: `${x - (side - w) / 2} ${y - (side - h) / 2} ${side} ${side}`,
		width: `${side}`,
		height: `${side}`
	}));
};
/**
* Icons from the `@iconify-json/<collection>` package installed in the project (read from `node_modules` when the
* module runs; the project is the working directory), or from the `.svg` files of a directory (relative to the working
* directory, named without the extension). Say which collection in the type argument to have the names checked as you
* type: `icons<typeof import("@iconify-json/mdi/icons.json")>({ provider: "iconify-json", collection: "mdi" })`. A name
* that does not exist is a build error that suggests the nearest one.
*
* One scope, "icons", whatever the collection: its kernels are the same, and `build` is the same code, which the engine
* takes as one definition however many times `icons()` runs.
*
* @param {Options} options where the icons come from
* @returns {Icons<IconName<C>>} a function of the icon name: a style for `cn()`
*/
const icons = (options) => {
	const source = options.provider === "fs" ? files(options.dir) : iconify(options.collection);
	return scope("icons", {
		mask,
		image,
		icon: { args: arg() }
	}).build({ icon: (name) => {
		const icon = source.get(name);
		if (!icon) {
			const near = nearest(name, source.names());
			throw new Error(`cssints: icons: no icon ${JSON.stringify(name)} in ${source.label}${near ? `, did you mean ${near}?` : ""}`);
		}
		return {
			decls: [["--_svg", urlOf(icon)]],
			uses: [icon.body.includes("currentColor") ? "mask" : "image"]
		};
	} }).export().icon;
};
//#endregion
export { icons };
