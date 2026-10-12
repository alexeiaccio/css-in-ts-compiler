import { attach as e, gitRoot as t, servers as n, sessionOf as r } from "cssints/devtools-link";
//#region src/opencode.ts
var i = "cssints-devtools", a = (e, t) => t.map((t) => {
	let n = r(e, t.id);
	return `- ${t.id}  ${t.url}  ${t.root}${n ? `  (session ${n})` : ""}`;
}).join("\n"), o = (t, o, s) => {
	let c = n(t), [l = "", ...u] = s.trim().split(/\s+/), d = l === "off" ? u.join(" ") : l, f = d ? c.filter((e) => e.id.includes(d)) : c, p = f.filter((e) => e.id === d), m = p.length ? p : f;
	if (l === "off") {
		let n = m.filter((e) => d ? !0 : r(t, e.id) === o);
		return n.forEach((n) => e(t, n.id)), n.length ? `Detached from ${n.map((e) => e.id).join(", ")}: its devtools panel starts a new session per prompt again.` : d ? `No running dev server matches "${d}".\n${a(t, c)}` : "This session is not attached to any dev server.";
	}
	if (!c.length) return `No cssints dev server with \`devtools: true, opencode: true\` runs in ${t}. Start one, then run /${i} again.`;
	let [h, g] = m;
	return h ? g ? `${m.length} dev servers run${d ? ` that match "${d}"` : ""}; none is attached. Run /${i} <id> to pick one:\n${a(t, m)}` : (e(t, h.id, o), `Attached this session (${o}) to the dev server ${h.id} (${h.url}, ${h.root}). The prompts of its devtools panel now go to this session. /${i} off detaches.`) : `No running dev server matches "${d}". Running:\n${a(t, c)}`;
}, s = {
	id: "cssints.devtools",
	setup(e) {
		let n = t(e.location.directory);
		return e.command.transform((t) => t.add({
			name: i,
			description: "Attach this session to the devtools of a cssints dev server (off detaches)",
			execute: ({ sessionID: t, prompt: r }) => e.session.synthetic({
				sessionID: t,
				text: `${o(n, t, r.text)}\n\n(A notice from the /${i} command: acknowledge it in one short sentence and run no tools.)`
			}).then(() => void 0)
		})).then((e) => () => e.dispose());
	}
};
//#endregion
export { i as COMMAND, s as default, o as run };
