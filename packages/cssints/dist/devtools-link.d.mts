//#region src/devtools-link.d.ts
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
export declare const gitRoot: (from: string) => string;
/**
 * @param {string} git the repository
 * @param {string} root the Vite root of a dev server
 * @returns {string} its id
 */
export declare const serverId: (git: string, root: string) => string;
/**
 * A dev server announces itself.
 * @param {string} git the repository
 * @param {string} root the Vite root
 * @param {string} url where it listens
 * @returns {() => void} the call that removes the announcement
 */
export declare const register: (git: string, root: string, url: string) => () => void;
/**
 * The dev servers that run now. A file whose process is gone (a crash left it) is removed.
 * ponytail: a reused pid keeps a stale file alive; the dev server rewrites it on its next start.
 * @param {string} git the repository
 * @returns {DevServer[]} the live ones, by id
 */
export declare const servers: (git: string) => {
  id: string;
  root: string;
  pid: number;
  url: string;
}[];
/**
 * @param {string} git the repository
 * @param {string} id a dev server's id
 * @returns {string | undefined} the session its prompts go to, if one is attached
 */
export declare const sessionOf: (git: string, id: string) => string | undefined;
/**
 * Attach a session to a dev server, or detach it.
 * @param {string} git the repository
 * @param {string} id a dev server's id
 * @param {string} [sessionID] the session; none detaches
 * @returns {void}
 */
export declare const attach: (git: string, id: string, sessionID?: string) => void;
//#endregion