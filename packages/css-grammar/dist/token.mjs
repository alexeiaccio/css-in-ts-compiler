//#region src/token.ts
/**
* Per token type, by the name of `token.<name>`:
* - `syntax`: the `@property` syntax, `<syntax>`, checked by the twin and by `ValidSyntax`;
* - `sentinels`: the typed-value types the token stands for in a property value (`⟨length⟩`, api-typed.ts);
* - `probes`: literals of the type that a build-time check puts in place of the token (one per sentinel), since the
*   recognizer reads text and a token is `var(--name)`;
* - `grammar`: the grammar of a value when it is not `<syntax>` (a list of shadows);
* - `property`: the `@property` syntax when `<syntax>` is not one `@property` takes: `*`, any value, which a browser
*   does not check or animate (an easing function, a shadow).
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
	},
	easingFunction: {
		syntax: "easing-function",
		sentinels: ["easing-function"],
		probes: ["ease"],
		property: "*"
	},
	shadow: {
		syntax: "shadow",
		sentinels: ["shadow"],
		probes: ["0 0 red"],
		grammar: "<shadow>#",
		property: "*"
	}
};
/**
* The grammar of a value of a token type.
* @param {string} syntax the `syntax` of the token type
* @returns {string} `<syntax>`, or the type's `grammar`
*/
const grammarOf = (syntax) => Object.values(TOKEN_TYPES).find((t) => t.syntax === syntax)?.grammar ?? `<${syntax}>`;
/**
* DTCG `$type` to token type (createTokens, docs/API.md "Themes"). `fontWeight` is a number: its keywords become numbers.
* The other DTCG types (`fontFamily`, `strokeStyle`, `border`, `transition`, `gradient`, `typography`) are an error.
*/
const DTCG_TYPES = {
	color: "color",
	dimension: "length",
	number: "number",
	duration: "time",
	fontWeight: "number",
	cubicBezier: "easingFunction",
	shadow: "shadow"
};
//#endregion
export { DTCG_TYPES, TOKEN_TYPES, grammarOf };
