// A fake OpenCode V2 service for the tests: the registration file that Service.discover reads (under XDG_STATE_HOME), /api/info,
// and the session calls the dev server makes (create, prompt, wait, get). `calls` records every request.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import { createServer as http } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

export const startFake = async () => {
  const state = mkdtempSync(join(tmpdir(), "opencode-state-"));
  process.env.XDG_STATE_HOME = state;
  const registration = join(state, "opencode/service.json");
  const calls = [];
  let outcome = "succeeded";
  const handle = async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const url = new URL(req.url, "http://x");
    calls.push({
      method: req.method,
      path: url.pathname,
      body: body ? JSON.parse(body) : undefined,
    });
    const json = (data) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(data));
    };
    if (url.pathname === "/api/info") return json({ version: "2.0.26", pid: process.pid });
    if (url.pathname === "/api/session" && req.method === "POST")
      return json({ data: { id: "ses_fake1" } });
    if (url.pathname.endsWith("/prompt")) return json({ data: { id: "msg_1" } });
    if (url.pathname.endsWith("/wait")) {
      await sleep(150);
      res.statusCode = 204;
      return res.end();
    }
    if (url.pathname === "/api/session/ses_fake1")
      return json({ data: { id: "ses_fake1", outcome } });
    res.statusCode = 404;
    res.end();
  };
  const fake = http((req, res) => void handle(req, res));
  fake.listen(0, "127.0.0.1");
  await once(fake, "listening");
  const register = () => {
    mkdirSync(dirname(registration), { recursive: true });
    writeFileSync(
      registration,
      JSON.stringify({
        url: `http://127.0.0.1:${fake.address().port}`, // same as url()
        pid: process.pid,
        version: "2.0.26",
      }),
    );
  };

  return {
    calls,
    // the address the registration file announces
    url: () => `http://127.0.0.1:${fake.address().port}`,
    register,
    unregister: () => rmSync(registration, { force: true }),
    outcome: (value) => (outcome = value),
    close: () => {
      fake.close();
      rmSync(state, { recursive: true });
    },
  };
};
