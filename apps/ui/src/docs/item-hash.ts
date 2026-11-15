// The fingerprint of an item's files, which is the one fact a conformance result records.
//
// sha256 over the item JSON's `files`, in the order the JSON lists them, each file contributing its
// `target`, one NUL byte, its `content` and another NUL byte. The NULs keep the boundaries: no target
// and no registry file's content holds one, so two different file lists cannot land on the same bytes
// by moving a boundary between them. `sha256:` prefixes the lowercase hex.
//
// Both sides call this one function: `scripts/starter-smoke.mjs` over the item JSON its local server
// gave the CLI — the files the copy actually installed — and the docs page over the item JSON it
// bundles. A result whose fingerprint no longer matches the item describes files that are not on the
// page any more, so the page hides it instead of claiming a test that never ran on this content.
//
// WebCrypto, so the same code runs in Node, Bun and the browser.

/** A file of an item, as far as the fingerprint is concerned: where it lands and what it holds. */
export interface HashedFile {
  readonly target: string;
  readonly content: string;
}

/**
 * The fingerprint of an item's files: `sha256:<64 hex>`.
 *
 * @param {ReadonlyArray<HashedFile>} files the item's `files`, in the JSON's order
 * @returns {Promise<string>} the fingerprint
 */
export const itemHash = async (files: ReadonlyArray<HashedFile>): Promise<string> => {
  const text = files.map((file) => `${file.target}\u0000${file.content}\u0000`).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"));
  return `sha256:${hex.join("")}`;
};
