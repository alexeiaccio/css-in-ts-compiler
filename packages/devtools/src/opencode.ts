// The OpenCode V2 plugin of @cssints/devtools (`plugins: ["@cssints/devtools/opencode"]` in opencode.jsonc): the command
// `/cssints-devtools`, which attaches the session it runs in to a dev server of this repository, so that the prompts of that
// server's devtools panel go to this session. The executor of a plugin command receives the id of its session (a markdown
// command cannot know it). The rendezvous is files (cssints/devtools-link); the outcome is told in the session.
import { attach, gitRoot, servers, sessionOf } from "cssints/devtools-link";
import type { DevServer } from "cssints/devtools-link";

/** The part of the plugin context (`@opencode/plugin`, Context) this plugin uses. */
interface Context {
  readonly location: { readonly directory: string };
  readonly command: {
    transform(
      callback: (editor: {
        add(command: {
          name: string;
          description: string;
          execute(input: {
            sessionID: string;
            prompt: { text: string };
            delivery: string;
          }): Promise<void>;
        }): void;
      }) => void,
    ): Promise<{ dispose(): Promise<void> }>;
  };
  readonly session: {
    synthetic(input: { sessionID: string; text: string }): Promise<{ readonly id: string }>;
  };
}

export const COMMAND = "cssints-devtools";

const list = (git: string, running: DevServer[]) =>
  running
    .map((s) => {
      const session = sessionOf(git, s.id);
      return `- ${s.id}  ${s.url}  ${s.root}${session ? `  (session ${session})` : ""}`;
    })
    .join("\n");

/**
 * What `/cssints-devtools <args>` does in a session, and what it says.
 * @param {string} git the repository
 * @param {string} sessionID the session the command runs in
 * @param {string} args the text after the command: nothing, `off [id]`, or an id or a part of one
 * @returns {string} the message for the session
 */
export const run = (git: string, sessionID: string, args: string) => {
  const running = servers(git);
  const [first = "", ...rest] = args.trim().split(/\s+/);
  const want = first === "off" ? rest.join(" ") : first;
  const named = want ? running.filter((s) => s.id.includes(want)) : running;
  const pick = named.filter((s) => s.id === want);
  const found = pick.length ? pick : named;

  if (first === "off") {
    const mine = found.filter((s) => (want ? true : sessionOf(git, s.id) === sessionID));
    mine.forEach((s) => attach(git, s.id));
    return mine.length
      ? `Detached from ${mine.map((s) => s.id).join(", ")}: its devtools panel starts a new session per prompt again.`
      : want
        ? `No running dev server matches "${want}".\n${list(git, running)}`
        : "This session is not attached to any dev server.";
  }
  if (!running.length)
    return `No cssints dev server with \`devtools: true, opencode: true\` runs in ${git}. Start one, then run /${COMMAND} again.`;
  const [one, two] = found;
  if (!one) return `No running dev server matches "${want}". Running:\n${list(git, running)}`;
  if (two)
    return `${found.length} dev servers run${want ? ` that match "${want}"` : ""}; none is attached. Run /${COMMAND} <id> to pick one:\n${list(git, found)}`;
  attach(git, one.id, sessionID);
  return `Attached this session (${sessionID}) to the dev server ${one.id} (${one.url}, ${one.root}). The prompts of its devtools panel now go to this session. /${COMMAND} off detaches.`;
};

export default {
  id: "cssints.devtools",
  setup(ctx: Context) {
    const git = gitRoot(ctx.location.directory);
    return ctx.command
      .transform((editor) =>
        editor.add({
          name: COMMAND,
          description: "Attach this session to the devtools of a cssints dev server (off detaches)",
          // admitted with resume (the default): resume: false keeps the notice in the inbox, out of the transcript, until the next prompt
          execute: ({ sessionID, prompt }) =>
            ctx.session
              .synthetic({
                sessionID,
                text: `${run(git, sessionID, prompt.text)}\n\n(A notice from the /${COMMAND} command: acknowledge it in one short sentence and run no tools.)`,
              })
              .then(() => undefined),
        }),
      )
      .then((registration) => () => registration.dispose());
  },
};
