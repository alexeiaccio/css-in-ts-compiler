// Prints an ITF trace of runner.qnt (quint run --mbt --out-itf=x.itf.json) one step per line.
import { readFileSync } from "node:fs";

const v = (x) => (x?.["#bigint"] ? Number(x["#bigint"]) : x?.["#map"] ? Object.fromEntries(x["#map"].map(([k, y]) => [v(k), v(y)])) : x?.["#set"] ? x["#set"].map(v) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, v(y)])) : x);
for (const st of JSON.parse(readFileSync(process.argv[2], "utf8")).states) {
  const s = v(Object.entries(st).find(([k]) => k.endsWith("::s"))[1]);
  const picks = Object.entries(v(st["mbt::nondetPicks"]) ?? {}).map(([k, x]) => x?.tag === "Some" ? `${k}=${x.value}` : "").filter(Boolean);
  const tx = Object.values(s.txs).filter((t) => t.pc !== "free").map((t) => `${t.c}@${t.pc}${t.stale ? "(stale)" : ""}`);
  const out = (c) => (s.cached[c].src < 0 ? "-" : `${s.cached[c].src}/${s.cached[c].self}/${s.cached[c].tokens}`);
  console.log(`${`${st["mbt::actionTaken"]} ${picks.join(" ")}`.padEnd(26)} disk ${Object.values(s.disk).join("")} cached card ${out("card")} button ${out("button")}  ${tx.join(" ")}`);
}
