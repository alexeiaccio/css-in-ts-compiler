import bcd from "@mdn/browser-compat-data" with { type: "json" };
import { listAll as listAllCss } from "@webref/css";
import { listAll as listAllIdl } from "@webref/idl";
import cssSyntaxes from "mdn-data/css/syntaxes.json";
import cssTypes from "mdn-data/css/types.json";

async function main() {
	const idl = await listAllIdl();
	const css = await listAllCss();

	const map = new Map<string, string>();
	for (const [key, file] of Object.entries(idl)) {
		const text = await file.text();
		map.set(key, text);
	}

	return { css, map, bcd, cssSyntaxes, cssTypes };
}

main();
