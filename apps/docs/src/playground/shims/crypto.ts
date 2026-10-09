// node:crypto for the engine: createHash("sha1").update(text).digest("hex"), the class and token names. Web Crypto is async,
// and the class hash is sync, so this is SHA-1 in plain code (test/playground.mjs compares it with Node's).
const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));

const sha1 = (bytes: Uint8Array): string => {
  const words = new Uint32Array((((bytes.length + 8) >> 6) + 1) * 16);
  const view = new DataView(words.buffer);
  const padded = new Uint8Array(words.buffer);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  // big-endian words: swap what the byte copy wrote little-endian
  for (let i = 0; i < words.length; i++) words[i] = view.getUint32(i * 4, false);
  words[words.length - 2] = Math.floor((bytes.length * 8) / 2 ** 32);
  words[words.length - 1] = (bytes.length * 8) >>> 0;
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const w = new Uint32Array(80);
  for (let b = 0; b < words.length; b += 16) {
    for (let i = 0; i < 16; i++) w[i] = words[b + i]!;
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!, 1);
    let [a, bb, c, d, e] = h as [number, number, number, number, number];
    for (let i = 0; i < 80; i++) {
      const [f, k] =
        i < 20
          ? [(bb & c) | (~bb & d), 0x5a827999]
          : i < 40
            ? [bb ^ c ^ d, 0x6ed9eba1]
            : i < 60
              ? [(bb & c) | (bb & d) | (c & d), 0x8f1bbcdc]
              : [bb ^ c ^ d, 0xca62c1d6];
      const t = (rotl(a, 5) + f + e + k + w[i]!) | 0;
      e = d;
      d = c;
      c = rotl(bb, 30);
      bb = a;
      a = t;
    }
    h[0] = (h[0]! + a) | 0;
    h[1] = (h[1]! + bb) | 0;
    h[2] = (h[2]! + c) | 0;
    h[3] = (h[3]! + d) | 0;
    h[4] = (h[4]! + e) | 0;
  }
  return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
};

export const createHash = (algorithm: string) => {
  if (algorithm !== "sha1")
    throw new Error(`playground: createHash(${algorithm}) is not available`);
  let text = "";
  const hash = {
    update(s: string) {
      text += s;
      return hash;
    },
    digest(encoding: string) {
      if (encoding !== "hex") throw new Error(`playground: digest(${encoding}) is not available`);
      return sha1(new TextEncoder().encode(text));
    },
  };
  return hash;
};
