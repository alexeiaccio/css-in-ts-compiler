// The Format button: oxfmt's formatter (oxc_formatter) as wasm, @wasm-fmt/oxc_fmt, with the repository's options (2 spaces, double
// quotes, semicolons, trailing commas: its defaults) and the width of `vp fmt`. Its own chunk and its own .wasm, fetched when the
// button is first used. It formats JavaScript and TypeScript; oxfmt's CSS goes through Prettier's JavaScript, which has no wasm build.
export const formats = (name: string) => /\.[cm]?[jt]sx?$/.test(name);

let ready: Promise<typeof import("@wasm-fmt/oxc_fmt/web").format> | undefined;

/**
 * Formats the text of a file as `vp fmt` does.
 * @param {string} code the text
 * @param {string} name the file name, which says the language
 * @returns {Promise<string>} the formatted text; it throws when the text does not parse
 */
export const format = async (code: string, name: string): Promise<string> => {
  ready ??= (async () => {
    const [{ default: init, format }, { default: wasm }] = await Promise.all([
      import("@wasm-fmt/oxc_fmt/web"),
      import("@wasm-fmt/oxc_fmt/wasm?url"),
    ]);
    await init(wasm);
    return format;
  })();
  return (await ready)(code, name, { lineWidth: 100 });
};
