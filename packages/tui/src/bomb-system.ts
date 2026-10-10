// The system theme on @bomb.sh/tty (docs/research/tui.md "The system theme"): bomb.sh has no query and its input
// parser drops OSC replies, so the follower writes the queries and takes the replies out of stdin's bytes before
// `input.scan()` sees them. bomb.sh has no indexed colour: a terminal that reports nothing keeps the static theme.
// @effect-diagnostics globalTimers:off -- plain run-time code of a terminal app (plainCode): a timer, no Effect
import { setTheme } from "./index.ts";
import { NOTIFY, QUERY, type Report, scan, type SystemTheme, UNNOTIFY } from "./system.ts";

/** A system theme fed by the bytes of stdin. */
export interface SystemFollower {
  /** Takes the terminal's replies out of a chunk of stdin and gives back the rest, for `input.scan()`. */
  feed(bytes: Uint8Array): Uint8Array;
  /** Settles when the terminal answered or `wait` ms passed, the fallback in place; a late reply still applies. */
  ready: Promise<void>;
  /** Turns the change notifications off and stops the timer. */
  stop(): void;
}

const binary = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
};

/**
 * Follows the terminal's colours: writes the queries (OSC 10, 11, 4, `CSI ? 996 n`) and turns on mode 2031, sets the
 * system theme (`setTheme`), and rebuilds it from the replies `feed` finds; on a change notification it queries again.
 *
 * @param {SystemTheme} theme the theme of `createSystemTheme`
 * @param {object} options `write` (the bytes to the terminal), `wait` (ms, default 100), `colorfgbg` (default: the environment's)
 * @returns {SystemFollower} `feed`, `ready` and `stop`
 */
export const followSystemTheme = (
  theme: SystemTheme,
  options: { write: (text: string) => void; wait?: number; colorfgbg?: string },
): SystemFollower => {
  const report: Report & { ansi: (string | undefined)[] } = { ansi: [] };
  const apply = () => theme.apply(report, { colorfgbg: options.colorfgbg });
  let tail = "";
  let done = false;
  const { promise: ready, resolve: settle } = Promise.withResolvers<void>();
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    apply();
    settle();
  };
  const timer = setTimeout(finish, options.wait ?? 100);
  apply();
  setTheme(theme.name);
  options.write(QUERY + NOTIFY);
  return {
    ready,
    feed: (bytes) => {
      const { replies, rest, tail: cut } = scan(tail + binary(bytes));
      tail = cut;
      const found = replies.fg || replies.bg || replies.scheme || replies.ansi.size;
      if (replies.fg) report.fg = replies.fg;
      if (replies.bg) report.bg = replies.bg;
      for (const [i, hex] of replies.ansi) report.ansi[i] = hex;
      if (replies.scheme) {
        report.scheme = replies.scheme;
        if (done) options.write(QUERY); // a notification of a change: the colours again
      }
      const complete = report.fg && report.bg && report.ansi.filter(Boolean).length === 16;
      if (found && done) apply();
      else if (complete) finish();
      return Uint8Array.from(rest, (ch) => ch.charCodeAt(0));
    },
    stop: () => {
      clearTimeout(timer);
      options.write(UNNOTIFY);
    },
  };
};
