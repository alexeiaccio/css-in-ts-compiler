// The rendezvous of a dev server of `cssints({ devtools: true, opencode })` and the OpenCode command `cssints-devtools`
// (@cssints/devtools/opencode): plain files in <git root>/node_modules/.cache/cssints-devtools/, no network route (the ask
// channel is the HMR socket, which Vite's token protects).
//   <id>.json          { root, pid, url }  written by the dev server while it runs
//   <id>.session.json  { sessionID }       written by the command: the session the prompts of that dev server go to
// The id is the Vite root relative to the git root, `/` replaced by `-`.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** A running dev server, as it announced itself. */
export interface DevServer {
  id: string;
  root: string;
  pid: number;
  url: string;
}

/**
 * The repository of an app is the workspace of its sessions: the nearest folder up with a `.git` (a file in a worktree).
 * @param {string} from a folder
 * @returns {string} the repository, or `from` when there is none
 */
export const gitRoot = (from: string) =>
  from
    .split(sep)
    .map((_, i, parts) => parts.slice(0, parts.length - i).join(sep) || sep)
    .find((dir) => existsSync(join(dir, ".git"))) ?? from;

const dir = (git: string) => join(git, "node_modules/.cache/cssints-devtools");

/**
 * @param {string} git the repository
 * @param {string} root the Vite root of a dev server
 * @returns {string} its id
 */
export const serverId = (git: string, root: string) =>
  relative(git, root).split(sep).join("-") || "root";

// what a file may hold; the readers check each field they use, a file may be anything
interface Fields {
  root?: string;
  pid?: number;
  url?: string;
  sessionID?: string;
}

const read = (file: string) => {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Fields;
  } catch {
    return {} as Fields;
  }
};

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
};

/**
 * A dev server announces itself.
 * @param {string} git the repository
 * @param {string} root the Vite root
 * @param {string} url where it listens
 * @returns {() => void} the call that removes the announcement
 */
export const register = (git: string, root: string, url: string) => {
  const file = join(dir(git), `${serverId(git, root)}.json`);
  mkdirSync(dir(git), { recursive: true });
  writeFileSync(file, JSON.stringify({ root, pid: process.pid, url }));
  return () => rmSync(file, { force: true });
};

/**
 * The dev servers that run now. A file whose process is gone (a crash left it) is removed.
 * ponytail: a reused pid keeps a stale file alive; the dev server rewrites it on its next start.
 * @param {string} git the repository
 * @returns {DevServer[]} the live ones, by id
 */
export const servers = (git: string) => {
  if (!existsSync(dir(git))) return [];
  return readdirSync(dir(git))
    .filter((f) => f.endsWith(".json") && !f.endsWith(".session.json"))
    .flatMap((f) => {
      const { root, pid, url } = read(join(dir(git), f));
      if (typeof root !== "string" || typeof pid !== "number" || typeof url !== "string") return [];
      if (alive(pid))
        return [{ id: f.slice(0, -".json".length), root, pid, url } satisfies DevServer];
      rmSync(join(dir(git), f), { force: true });
      return [];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
};

/**
 * @param {string} git the repository
 * @param {string} id a dev server's id
 * @returns {string | undefined} the session its prompts go to, if one is attached
 */
export const sessionOf = (git: string, id: string) => {
  const { sessionID } = read(join(dir(git), `${id}.session.json`));
  return typeof sessionID === "string" ? sessionID : undefined;
};

/**
 * Attach a session to a dev server, or detach it.
 * @param {string} git the repository
 * @param {string} id a dev server's id
 * @param {string} [sessionID] the session; none detaches
 * @returns {void}
 */
export const attach = (git: string, id: string, sessionID?: string) => {
  const file = join(dir(git), `${id}.session.json`);
  if (sessionID) {
    mkdirSync(dir(git), { recursive: true });
    writeFileSync(file, JSON.stringify({ sessionID }));
  } else rmSync(file, { force: true });
};
