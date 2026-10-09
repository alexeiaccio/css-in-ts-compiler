// The code in the URL hash: `#code=<deflate-raw, base64url>`, so a link holds the whole playground and no server does.
const KEY = "code=";

const base64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const bytes = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

const pipe = async (
  data: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
) =>
  new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());

/**
 * The hash for a text.
 * @param {string} text the code
 * @returns {Promise<string>} `code=` and the text, deflated, in base64url
 */
export const encode = async (text: string): Promise<string> =>
  KEY + base64(await pipe(new TextEncoder().encode(text), new CompressionStream("deflate-raw")));

/**
 * The code a hash holds.
 * @param {string} hash `location.hash`
 * @returns {Promise<string | undefined>} the code, or undefined when the hash holds none (or something else)
 */
export const decode = async (hash: string): Promise<string | undefined> => {
  const value = hash.replace(/^#/, "");
  if (!value.startsWith(KEY)) return undefined;
  try {
    return new TextDecoder().decode(
      await pipe(bytes(value.slice(KEY.length)), new DecompressionStream("deflate-raw")),
    );
  } catch {
    return undefined;
  }
};
