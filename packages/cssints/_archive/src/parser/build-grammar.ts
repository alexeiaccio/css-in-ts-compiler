import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, "..", "..", "..")  // Go up to cssints directory

const grammarPath = join(__dirname, "src", "grammars", "webidl.ohm")

console.log("Current directory:", process.cwd())
console.log("__dirname:", __dirname)
console.log("grammarPath:", grammarPath)
console.log("Files in cssints:", require("node:fs").readdirSync(__dirname))

if (!existsSync(grammarPath)) {
  console.error(`Grammar file not found: ${grammarPath}`)
  process.exit(1)
}

const grammarText = readFileSync(grammarPath, "utf-8")

// Generate standalone JavaScript bundle
const jsBundle = `import { Grammar as _Grammar } from "ohm-js";

const grammar = _Grammar.fromSource(\`
${grammarText}
\`);

export const webidlGrammar = grammar;
`

const outputPath = join(__dirname, "src", "grammars", "webidl.js")

console.log("Output path:", outputPath)

// Create directories if they don't exist
const outputDir = join(__dirname, "src", "grammars")
if (!existsSync(outputDir)) {
  console.log("Creating directory:", outputDir)
  mkdirSync(outputDir, { recursive: true })
}

writeFileSync(outputPath, jsBundle, "utf-8")
console.log("Generated webidl.js at:", outputPath)
