import { join, relative, sep } from "node:path";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
//#region src/devtools-link.ts
/**
* The repository of an app is the workspace of its sessions: the nearest folder up with a `.git` (a file in a worktree).
* @param {string} from a folder
* @returns {string} the repository, or `from` when there is none
*/
const gitRoot = (from) => from.split(sep).map((_, i, parts) => parts.slice(0, parts.length - i).join(sep) || sep).find((dir) => existsSync(join(dir, ".git"))) ?? from;
const dir = (git) => join(git, "node_modules/.cache/cssints-devtools");
/**
* @param {string} git the repository
* @param {string} root the Vite root of a dev server
* @returns {string} its id
*/
const serverId = (git, root) => relative(git, root).split(sep).join("-") || "root";
const read = (file) => {
	try {
		return JSON.parse(readFileSync(file, "utf8"));
	} catch {
		return {};
	}
};
const alive = (pid) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return e.code === "EPERM";
	}
};
/**
* A dev server announces itself.
* @param {string} git the repository
* @param {string} root the Vite root
* @param {string} url where it listens
* @returns {() => void} the call that removes the announcement
*/
const register = (git, root, url) => {
	const file = join(dir(git), `${serverId(git, root)}.json`);
	mkdirSync(dir(git), { recursive: true });
	writeFileSync(file, JSON.stringify({
		root,
		pid: process.pid,
		url
	}));
	return () => rmSync(file, { force: true });
};
/**
* The dev servers that run now. A file whose process is gone (a crash left it) is removed.
* ponytail: a reused pid keeps a stale file alive; the dev server rewrites it on its next start.
* @param {string} git the repository
* @returns {DevServer[]} the live ones, by id
*/
const servers = (git) => {
	if (!existsSync(dir(git))) return [];
	return readdirSync(dir(git)).filter((f) => f.endsWith(".json") && !f.endsWith(".session.json")).flatMap((f) => {
		const { root, pid, url } = read(join(dir(git), f));
		if (typeof root !== "string" || typeof pid !== "number" || typeof url !== "string") return [];
		if (alive(pid)) return [{
			id: f.slice(0, -5),
			root,
			pid,
			url
		}];
		rmSync(join(dir(git), f), { force: true });
		return [];
	}).sort((a, b) => a.id.localeCompare(b.id));
};
/**
* @param {string} git the repository
* @param {string} id a dev server's id
* @returns {string | undefined} the session its prompts go to, if one is attached
*/
const sessionOf = (git, id) => {
	const { sessionID } = read(join(dir(git), `${id}.session.json`));
	return typeof sessionID === "string" ? sessionID : void 0;
};
/**
* Attach a session to a dev server, or detach it.
* @param {string} git the repository
* @param {string} id a dev server's id
* @param {string} [sessionID] the session; none detaches
* @returns {void}
*/
const attach = (git, id, sessionID) => {
	const file = join(dir(git), `${id}.session.json`);
	if (sessionID) {
		mkdirSync(dir(git), { recursive: true });
		writeFileSync(file, JSON.stringify({ sessionID }));
	} else rmSync(file, { force: true });
};
//#endregion
export { servers as a, serverId as i, gitRoot as n, sessionOf as o, register as r, attach as t };
