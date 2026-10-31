// The connection ids of `npm trust list <package> --json`, for scripts/trust.sh. A trusted publisher connection cannot be
// edited on npm, so the only way to turn a stage-only connection into one that may `npm publish` is to revoke it and create
// it again: this prints the ids to revoke.
//
//   npm trust list @cssints/headless --json | node scripts/trust.mjs ids
//   node scripts/trust.mjs --check
const WORKFLOW = /release\.yml/i;
const GITHUB = /github/i;

/**
 * Every object in the tree that carries an id, flattened (the CLI's shape is not a contract).
 *
 * @param {unknown} node the parsed JSON to walk
 * @param {object[]} out the accumulator a recursive call appends to
 * @returns {object[]} the objects that carry an id, in the tree's order
 */
const objects = (node, out = []) => {
  if (Array.isArray(node)) {
    for (const item of node) objects(item, out);
  } else if (typeof node === "object" && node !== null) {
    if (typeof node.id === "string" || typeof node.id === "number") out.push(node);
    for (const value of Object.values(node)) objects(value, out);
  }
  return out;
};

/**
 * The ids of the GitHub Actions connections to `release.yml` — the ones a recreate has to revoke. A connection for another
 * workflow or another provider is left alone; a listing with no id at all is an error, not an empty answer.
 *
 * @param {unknown} listing the parsed `npm trust list --json`
 * @returns {string[]} the ids, in the listing's order
 */
export const ids = (listing) => {
  const all = objects(listing);
  const mine = all.filter((connection) => {
    const text = JSON.stringify(connection);
    return GITHUB.test(text) && WORKFLOW.test(text);
  });
  const picked = mine.length > 0 ? mine : all;
  return picked.map((connection) => String(connection.id));
};

if (process.argv.includes("--check")) {
  const fit = {
    connections: [
      {
        id: "abc",
        provider: "github",
        repo: "alexeiaccio/css-in-ts-compiler",
        file: "release.yml",
      },
      { id: "def", provider: "gitlab", project: "other", file: "publish.yml" },
    ],
  };
  const flat = [{ id: 7, file: "release.yml", provider: "github" }];
  const nothing = { connections: [] };
  const results = { fit: ids(fit), flat: ids(flat), nothing: ids(nothing) };
  const expected = { fit: ["abc"], flat: ["7"], nothing: [] };
  const ok = JSON.stringify(results) === JSON.stringify(expected);
  process.stdout.write(
    `${JSON.stringify(results)}${ok ? "" : ` — wrong, want ${JSON.stringify(expected)}`}\n`,
  );
  process.exit(ok ? 0 : 1);
}

if (process.argv.includes("ids")) {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  // A package that has no trusted publisher yet is answered with nothing on stdout ("No trust configurations found" goes to
  // stderr) and an empty `connections` in a JSON listing: both mean nothing to revoke, and the create step that follows in
  // scripts/trust.sh makes the first connection (@cssints/reactive, the 28th package). A listing that failed exits earlier.
  if (raw.trim() === "") process.exit(0);
  const listing = JSON.parse(raw);
  if (Array.isArray(listing?.connections) && listing.connections.length === 0) process.exit(0);
  const found = ids(listing);
  if (found.length === 0) {
    process.stderr.write(
      "no connection in this listing carries an id: revoke it by hand (npm trust revoke <pkg> --id=…)\n",
    );
    process.exit(1);
  }
  process.stdout.write(`${found.join("\n")}\n`);
}
