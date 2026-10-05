//#region src/token.ts
/**
* Per token type, by the name of `token.<name>`:
* - `syntax`: the `@property` syntax, `<syntax>`, checked by the twin and by `ValidSyntax`;
* - `sentinels`: the typed-value types the token stands for in a property value (`⟨length⟩`, api-typed.ts);
* - `probes`: literals of the type that a build-time check puts in place of the token (one per sentinel), since the
*   recognizer reads text and a token is `var(--name)`.
*/
const TOKEN_TYPES = {
	color: {
		syntax: "color",
		sentinels: ["color"],
		probes: ["red"]
	},
	length: {
		syntax: "length",
		sentinels: ["length"],
		probes: ["1px"]
	},
	percentage: {
		syntax: "percentage",
		sentinels: ["percentage"],
		probes: ["1%"]
	},
	lengthPercentage: {
		syntax: "length-percentage",
		sentinels: ["length", "percentage"],
		probes: ["1px", "1%"]
	},
	number: {
		syntax: "number",
		sentinels: ["number"],
		probes: ["1"]
	},
	integer: {
		syntax: "integer",
		sentinels: ["integer"],
		probes: ["1"]
	},
	angle: {
		syntax: "angle",
		sentinels: ["angle"],
		probes: ["1deg"]
	},
	time: {
		syntax: "time",
		sentinels: ["time"],
		probes: ["1s"]
	},
	customIdent: {
		syntax: "custom-ident",
		sentinels: ["custom-ident"],
		probes: ["x"]
	},
	resolution: {
		syntax: "resolution",
		sentinels: ["resolution"],
		probes: ["1dppx"]
	},
	url: {
		syntax: "url",
		sentinels: ["url"],
		probes: ["url(x)"]
	},
	image: {
		syntax: "image",
		sentinels: ["image"],
		probes: ["linear-gradient(red, blue)"]
	},
	transformList: {
		syntax: "transform-list",
		sentinels: ["transform-list"],
		probes: ["translateX(1px)"]
	}
};
/**
* DTCG `$type` to token type (createTokens, docs/API.md "Themes"). `fontWeight` is a number: its keywords become numbers.
* The other DTCG types (`fontFamily`, `cubicBezier`, `strokeStyle`, `border`, `transition`, `shadow`, `gradient`,
* `typography`) have no `@property` syntax and are an error.
*/
const DTCG_TYPES = {
	color: "color",
	dimension: "length",
	number: "number",
	duration: "time",
	fontWeight: "number"
};
//#endregion
export { DTCG_TYPES, TOKEN_TYPES };
