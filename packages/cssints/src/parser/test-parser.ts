import { parseWebIDL } from "./webidl-parser.ts"
import webidlGrammar from "../grammars/webidl.ohm-bundle.js"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"

const idlContent = readFileSync(join(dirname(dirname(__dirname)), "idl", "css-typed-om.idl"), "utf-8")
console.log("Parsing CSS Typed OM IDL...")
console.log("Input length:", idlContent.length, "characters")

try {
  // Remove comments and empty lines
  let idlLines = idlContent
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .filter((line) => line.trim().length > 0)
    .join("\n")

  // Strip extended attributes (simplified: remove everything between [ and the matching ])
  idlLines = idlLines.replace(/\[[^\]]*\]/g, "")

  console.log("Cleaned IDL length:", idlLines.length, "characters")

   console.log("Cleaned IDL length:", idlLines.length, "characters")
   console.log("First 500 characters:", idlLines.substring(0, 500))
   console.log("\nTesting grammar match directly...")
   const match = webidlGrammar.match(idlLines)
   if (match.failed()) {
     console.log("Grammar match failed")
     if (match.interval) {
       console.log("Failed at position:", match.interval.startIdx)
       console.log("Input around error:", idlLines.substring(match.interval.startIdx, match.interval.endIdx + 20))
     }
     console.log("Error message:", match.message)
     console.log("\nTrying simpler test...")
     const simpleMatch = webidlGrammar.match("interface CSSStyleValue {};")
     if (simpleMatch.succeeded()) {
       console.log("Simple interface match succeeded!")
     } else {
       console.log("Simple interface match failed:", (simpleMatch as any).message)
     }
   } else {
     console.log("Grammar match succeeded!")
     console.log("Match type:", match.constructor.name)
   }

   const result = parseWebIDL(idlLines)
  console.log("\n✓ Parsing succeeded!")
  console.log("Found", result.length, "definitions")
  result.slice(0, 20).forEach((def, i) => {
    console.log(`  ${i + 1}. ${def.type}: ${def.name}`)
  })
  if (result.length > 20) {
    console.log(`  ... and ${result.length - 20} more`)
  }
} catch (error) {
  console.error("✗ Parsing failed:", error)
  process.exit(1)
}
