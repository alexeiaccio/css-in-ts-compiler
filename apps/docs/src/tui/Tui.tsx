import { FitAddon, init, Terminal } from "ghostty-web";
import { createSignal, onSettled } from "solid-js";

import { createHost, pagePalette, themeOf, watchSettings } from "./host.ts";
import { startSky } from "./sky.ts";
import * as s from "./styles.ts";

// The page: a terminal (ghostty-web: Ghostty's emulator compiled to WASM) and an app in it, csssky on @bomb.sh/tty with the
// styles of apps/csssky-tui. The app's colours come from the system theme, which asks the terminal; the terminal answers
// from the display settings of the site (host.ts).
export default function Tui() {
  const [status, setStatus] = createSignal("Starting the terminal…");
  let host: HTMLDivElement | undefined;

  onSettled(() => {
    document.getElementById("prerender")?.remove();
    document.getElementById("root")!.hidden = false;
    document.title = "TUI · cssints";
    let stop = () => {};
    void (async () => {
      await init();
      const palette = pagePalette();
      const term = new Terminal({
        fontSize: 14,
        fontFamily: getComputedStyle(host!).fontFamily,
        theme: themeOf(palette),
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(host!);
      Object.assign(host!, { terminal: term }); // for test/tui.mjs, which reads the cells back
      fit.fit();
      const io = createHost(term, palette);
      const sky = await startSky({ write: (b) => io.write(b), cols: term.cols, rows: term.rows });
      io.onInput((bytes) => sky.input(bytes));
      const resize = term.onResize(({ cols, rows }) => sky.resize(cols, rows));
      const observer = new ResizeObserver(() => fit.fit());
      observer.observe(host!);
      const unwatch = watchSettings(() => io.setPalette(pagePalette()));
      setStatus(`${term.cols}×${term.rows} cells`);
      stop = () => {
        unwatch();
        observer.disconnect();
        resize.dispose();
        sky.stop();
        io.dispose();
        term.dispose();
      };
    })();
    return () => stop();
  });

  return (
    <div class={s.page}>
      <h1 class={s.heading}>TUI</h1>
      <p class={s.text}>
        A real terminal in the page: Ghostty's emulator compiled to WebAssembly (ghostty-web) runs
        csssky's home feed on @bomb.sh/tty, styled by the cssints/tui styles of apps/csssky-tui
        through @cssints/tui/bomb. The posts are csssky's recorded fixtures. Keys: j/k move, tab
        switches the feed, enter opens a post, esc goes back; the mouse hovers and clicks. The
        colours are the system theme: the app asks the terminal for its palette, and the terminal
        answers from this site's display settings, so a change of palette or mode re-solves it.
      </p>
      <div class={s.screen} ref={(el) => (host = el)} data-terminal />
      <p class={s.status} role="status">
        {status()} · OpenTUI is not shown: its renderer is native Zig loaded over bun:ffi, which a
        browser cannot run.
      </p>
    </div>
  );
}
