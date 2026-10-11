// The pixel side of @cssints/placeholder: decode a JPEG or PNG to RGBA, average it down to a few cells (a box filter in
// linear light, alpha-weighted), and write the cells as CSS gradients (unpic-placeholder's layout) or as a thumbhash.
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { rgbaToThumbHash, thumbHashToRGBA } from "thumbhash";

/** Decoded pixels: `data` is RGBA, 4 bytes a pixel, row by row. */
export interface Pixels {
  width: number;
  height: number;
  data: Uint8Array;
}

const starts = (bytes: Uint8Array, sig: number[], at = 0) =>
  sig.every((b, i) => bytes[at + i] === b);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

// What a file is, by its first bytes (the extension may lie).
const kind = (bytes: Uint8Array) =>
  starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    ? "png"
    : starts(bytes, [0xff, 0xd8, 0xff])
      ? "jpeg"
      : starts(bytes, ascii("RIFF")) && starts(bytes, ascii("WEBP"), 8)
        ? "a WebP image"
        : starts(bytes, ascii("ftyp"), 4) &&
            /^(avif|avis)$/.test(String.fromCharCode(...bytes.slice(8, 12)))
          ? "an AVIF image"
          : starts(bytes, ascii("GIF8"))
            ? "a GIF image"
            : "not an image it knows";

/**
 * The RGBA pixels of a JPEG or PNG; anything else throws, naming what it is.
 * @param {Uint8Array} bytes the file
 * @returns {Pixels} its pixels
 */
export const decode = (bytes: Uint8Array): Pixels => {
  const k = kind(bytes);
  if (k === "png") {
    const png = PNG.sync.read(Buffer.from(bytes));
    return { width: png.width, height: png.height, data: png.data };
  }
  if (k === "jpeg") {
    const img = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    return { width: img.width, height: img.height, data: img.data };
  }
  throw new Error(`${k}: JPEG and PNG are read`);
};

const LINEAR = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const toSrgb = (l: number) => {
  const c = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

// The source pixels [from, to) of cell `i` of `n` over `size`: at least one, so a grid finer than the image repeats pixels.
const span = (i: number, n: number, size: number) => {
  const from = Math.min(size - 1, Math.floor((i * size) / n));
  return [from, Math.max(from + 1, Math.floor(((i + 1) * size) / n))] as const;
};

/**
 * `img` averaged to `w` × `h` (a box filter over the pixels each cell covers), in linear light and weighted by alpha, so
 * a transparent pixel gives no colour.
 * @param {Pixels} img the image
 * @param {number} w the width of the result
 * @param {number} h the height of the result
 * @returns {Pixels} `w` × `h` cells
 */
export const downsample = (img: Pixels, w: number, h: number): Pixels => {
  const data = new Uint8Array(w * h * 4);
  for (let cy = 0; cy < h; cy++) {
    const [y0, y1] = span(cy, h, img.height);
    for (const mx of Array(w).keys()) {
      const [x0, x1] = span(mx, w, img.width);
      let [r, g, b, a] = [0, 0, 0, 0];
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = (y * img.width + x) * 4;
          const alpha = img.data[i + 3]! / 255;
          r += LINEAR[img.data[i]!]! * alpha;
          g += LINEAR[img.data[i + 1]!]! * alpha;
          b += LINEAR[img.data[i + 2]!]! * alpha;
          a += alpha;
        }
      const c = (cy * w + mx) * 4;
      if (a) data.set([toSrgb(r / a), toSrgb(g / a), toSrgb(b / a)], c);
      data[c + 3] = Math.round((a / ((y1 - y0) * (x1 - x0))) * 255);
    }
  }
  return { width: w, height: h, data };
};

const hex = (d: Uint8Array, i: number) =>
  `#${[...d.subarray(i, i + (d[i + 3] === 255 ? 3 : 4))].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const pct = (n: number) => (n ? `${Math.round(n * 100)}%` : "0");

/**
 * unpic-placeholder's gradient: a radial gradient per cell of a `columns` × `rows` grid, at the cell's place and fading out
 * at 50%, brightest first (on top), over the image's average colour.
 * @param {Pixels} img the image
 * @param {number} columns the cells across
 * @param {number} rows the cells down
 * @returns {string} the layers, comma-separated (a `background-image` value)
 */
export const gradients = (img: Pixels, columns: number, rows: number) => {
  const { data } = downsample(img, columns, rows);
  const cells = Array.from({ length: columns * rows }, (_, c) => c);
  const luma = (c: number) =>
    0.299 * data[c * 4]! + 0.587 * data[c * 4 + 1]! + 0.114 * data[c * 4 + 2]!;
  // ties are kept in grid order (sort is stable), so the output is the same on every build
  cells.sort((a, b) => luma(b) - luma(a));
  const layers = cells.map(
    (c) =>
      `radial-gradient(at ${pct((c % columns) / (columns - 1))} ${pct(Math.floor(c / columns) / (rows - 1))}, ${hex(data, c * 4)}, transparent 50%)`,
  );
  const average = hex(downsample(img, 1, 1).data, 0);
  return [...layers, `linear-gradient(${average}, ${average})`].join(", ");
};

/**
 * The image's thumbhash (from a copy at most 100 px a side), rendered by thumbhash (32 px on the long side), averaged to
 * 16 px and written as a deflated PNG data URL: about 0.5 kB, where thumbhash's own `thumbHashToDataURL` (32 px, stored
 * uncompressed) is about 5 kB. The browser's smooth upscaling is the blur.
 * @param {Pixels} img the image
 * @returns {string} a `data:image/png;base64,…` URL
 */
export const thumbhash = (img: Pixels) => {
  const fit = (p: Pixels, side: number) => {
    const scale = Math.min(1, side / Math.max(p.width, p.height));
    return downsample(
      p,
      Math.max(1, Math.round(p.width * scale)),
      Math.max(1, Math.round(p.height * scale)),
    );
  };
  const small = fit(img, 100);
  const { w, h, rgba } = thumbHashToRGBA(rgbaToThumbHash(small.width, small.height, small.data));
  const out = fit({ width: w, height: h, data: rgba }, 16);
  const png = new PNG({ width: out.width, height: out.height });
  png.data = Buffer.from(out.data);
  return `data:image/png;base64,${PNG.sync.write(png, { deflateLevel: 9 }).toString("base64")}`;
};
