// `bun run version-packages`: `changeset version`, then this release at the top of CHANGELOG.md, from the summaries of the
// changesets (read before `changeset version` deletes them). Breaking changes and migrations are edited in by hand afterwards.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const notes = readdirSync(".changeset")
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .map((f) => {
    const [, head = "", body = ""] =
      /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(readFileSync(`.changeset/${f}`, "utf8")) ?? [];
    return { minor: /:\s*"?(minor|major)/.test(head), body: body.trim() };
  })
  .filter((n) => n.body);

execFileSync("changeset", ["version"], { stdio: "inherit" });

if (notes.length) {
  const { version } = JSON.parse(readFileSync("packages/cssints/package.json", "utf8"));
  const list = (minor) =>
    notes
      .filter((n) => n.minor === minor)
      .map((n) => `- ${n.body.replace(/\n/g, "\n  ")}`)
      .join("\n");
  const sections = [
    ["Minor changes", list(true)],
    ["Patch changes", list(false)],
  ]
    .filter(([, l]) => l)
    .map(([title, l]) => `### ${title}\n\n${l}\n`)
    .join("\n");
  const entry = `## ${version} (${new Date().toISOString().slice(0, 10)})\n\n${sections}\n`;
  const log = readFileSync("CHANGELOG.md", "utf8");
  const at = log.indexOf("\n## ") + 1;
  writeFileSync("CHANGELOG.md", log.slice(0, at) + entry + log.slice(at));
}
