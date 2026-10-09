// Token files from Figma tools (fixtures/importers, README.md there): Figma's per-mode DTCG export becomes tokens and a
// theme; what cssints does not read (Tokens Studio's legacy format, modifiers, math, modes in $extensions, booleans) is a
// build error that says what to do. Run: node importers.mjs
import assert from "node:assert/strict";

process.env.BROWSERSLIST = "chrome 130, firefox 130, safari 18";
const { createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const failure = async (f) => {
  try {
    await client.transformRequest(`/fixtures/importers/${f}.ts`);
  } catch (e) {
    return e.message;
  }
  throw new Error(`${f} passed`);
};

// Figma, Export modes: the default mode's file is the tokens, another mode's file is a theme as it is ($type, $extensions
// and the root's com.figma.modeName are skipped, each { $value } is the value).
await client.transformRequest("/fixtures/importers/figma-modes.ts");
const css = plugins[0].api.sheet([`${root}/fixtures/importers/figma-modes.ts`]);
for (const rule of [
  '@property --color-red{syntax:"<color>";inherits:true;initial-value:color(srgb 0.8886906504631042 0.15790081024169922 0.15790081024169922 / 1)}',
  '@property --padding-default{syntax:"<length>";inherits:true;initial-value:16px}',
  '@property --transition-duration{syntax:"<time>";inherits:true;initial-value:0.3s}',
  ":root{--color-danger:var(--color-red)}",
  // a key that starts with a digit is the set's _500
  "--color-gray-500:color(srgb 0.6118 0.6392 0.6863 / 1)",
  "@media (prefers-color-scheme: dark){:root{--color-red:color(srgb 1 0.4 0.4 / 1);--color-surface:color(srgb 0.0627 0.0627 0.0745 / 1);--color-danger:var(--color-red);",
])
  assert.ok(css.includes(rule), `${rule}\n${css}`);

for (const [f, message] of [
  [
    "figma-boolean",
    /^cssints: createTokens\(\): visibility is a Figma boolean variable \(com\.figma\.type "boolean"\)/,
  ],
  [
    "figma-theme-boolean",
    /^cssints: createGlobalTheme\(\): color\.red is a Figma boolean variable/,
  ],
  [
    "tokensbruecke-modes",
    /^cssints: createTokens\(\): clr-theme\.container-outline\.mid has modes in \$extensions \(light, dark\), which createTokens does not read: export one file per mode/,
  ],
  [
    "tokens-studio-legacy",
    /^cssints: createTokens\(\): global\.Main\.0 has value and type without \$, the legacy format of Tokens Studio/,
  ],
  [
    "tokens-studio-dtcg",
    /^cssints: createTokens\(\): \$themes of the root is a Tokens Studio file: pass the token sets/,
  ],
  [
    "tokens-studio-types",
    /^cssints: createTokens\(\): spacing\.base has \$type "spacing", which has no token type .* \("spacing" is a Tokens Studio type: its DTCG type is "dimension"\)$/,
  ],
  [
    "tokens-studio-modify",
    /^cssints: createTokens\(\): colors\.redLight has a Tokens Studio colour modifier/,
  ],
  [
    "tokens-studio-math",
    /^cssints: createTokens\(\): spacing\.lg value "\{spacing\.base\} \* 2" is math outside calc\(\) \(Tokens Studio math\): write "calc\(\{spacing\.base\} \* 2\)"$/,
  ],
])
  assert.match(await failure(f), message);

await server.close();
console.log(
  "importers: Figma's per-mode files as tokens and a theme, the rest a build error that says what to do",
);
