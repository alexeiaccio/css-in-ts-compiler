// plugin.ts in a Vite dev server: client modules card and button both import tokens. Every step is one stretch
// of synchronous JS between two awaits, so requests that Vite serves concurrently interleave.
// FIX = true is plugin.ts as it is; FIX = false is the version before cssints-hdui. Run (in packages/cssints/test):
//   npx @informalsystems/quint run spec/runner.qnt --main fixed --invariants servedFresh readsOwnSites depsOfKnown \
//     sheetFresh --witnesses settledAfterEdits sheetServed --max-steps 60 --max-samples 100000
//   --main original --invariant servedFresh --max-steps 14 --max-samples 2000000 --mbt --out-itf x.itf.json
//   finds the 13-step counterexample; node spec/trace.mjs x.itf.json prints it.
module runner {
  const FIX: bool

  pure val C = Set("card", "button") // client modules that use css.*
  pure val FILES = C.union(Set("tokens"))
  pure val SLOTS = 0.to(2) // two client transforms; slot 2 is the runner's own HMR re-import (FIX = false)
  pure val MAXV = 2 // edits per file

  // Versions of card.ts/button.ts (self) and tokens.ts an evaluation saw, src: of the client code the sites
  // were cut from. -1 = none. A node or evaluation "at -2" is in progress.
  type Out = { src: int, self: int, tokens: int }
  type Tx = { c: str, pc: str, src: int, self: int, tokens: int, want: int, pend: bool, stale: bool, ticket: int }
  type S = {
    disk: str -> int, // file versions
    ssr: str -> int, // ssr module graph transformResult (-1: invalidated)
    fetching: str -> int, // runner fetch in flight, the version its ssr transform read (-1: none)
    fetchStale: Set[str], // ... invalidated meanwhile: the ssr graph will not cache it
    code: str -> int, // runner module node: code version
    evaluated: str -> int, // runner module node: exports evaluated from this version
    sites: str -> Out, // globalThis.__cssints.sites (src unused)
    depsOf: Set[str], // depsOf.get("tokens.ts")
    cached: str -> Out, // client transformResult: what the next request of the module serves
    rules: str -> Out, // usedBy: the rules each module's latest evaluation gave (src unused)
    sheet: { ok: bool, rules: str -> Out }, // the sheet's client transformResult (ok false: loads rules again)
    sheetTx: { busy: bool, stale: bool, rules: str -> Out }, // a sheet request in flight, from the rules it loaded
    clientImports: Set[str], // client graph knows c imports tokens (importAnalysis ran)
    watch: Set[str], // edited, watcher event pending
    hot: Set[str], // module graphs invalidated, hotUpdate hooks pending
    reloads: int, // runner HMR full-reload messages queued (FIX = false)
    seen: Set[str], // imported by the runner (its HMR entrypoints)
    txs: int -> Tx,
    tickets: int,
  }

  pure val NONE: Out = { src: -1, self: -1, tokens: -1 }
  pure val FREE: Tx = { c: "", pc: "free", src: -1, self: -1, tokens: -1, want: -1, pend: false, stale: false, ticket: 0 }
  pure def clear(s: S): S = { ...s, code: FILES.mapBy(_ => -1), evaluated: FILES.mapBy(_ => -1) }
  pure def setTx(s: S, i: int, t: Tx): S = { ...s, txs: s.txs.set(i, t) }
  pure def inHook(t: Tx): bool = t.pc != "free" and t.pc != "cache"
  pure def holdsLock(t: Tx): bool = Set("self", "waitSelf", "tokens", "waitTokens", "read").contains(t.pc)
  pure def markStale(s: S, cs: Set[str]): S =
    { ...s, txs: s.txs.keys().mapBy(i => { val t = s.txs.get(i); if (cs.contains(t.c)) { ...t, stale: true } else t }) }

  pure val init0: S = {
    disk: FILES.mapBy(_ => 0), ssr: FILES.mapBy(_ => -1), fetching: FILES.mapBy(_ => -1), fetchStale: Set(),
    code: FILES.mapBy(_ => -1), evaluated: FILES.mapBy(_ => -1), sites: C.mapBy(_ => NONE), depsOf: Set(),
    cached: C.mapBy(_ => NONE), rules: C.mapBy(_ => NONE), sheet: { ok: false, rules: C.mapBy(_ => NONE) },
    sheetTx: { busy: false, stale: false, rules: C.mapBy(_ => NONE) }, clientImports: Set(), watch: Set(), hot: Set(), reloads: 0, seen: Set(),
    txs: SLOTS.mapBy(_ => FREE), tickets: 0,
  }

  // ---- the environment

  pure def doEdit(s: S, f: str): S = { ...s, disk: s.disk.setBy(f, v => v + 1), watch: s.watch.union(Set(f)) }

  // The watcher: every module graph invalidates f (moduleGraph.onFileChange). This sets lastInvalidationTimestamp,
  // so Vite will not cache in-flight transforms of f and of its known client importers (soft-invalidated).
  pure def doFileChange(s: S, f: str): S = {
    val s1 = { ...s, watch: s.watch.exclude(Set(f)), hot: s.hot.union(Set(f)), ssr: s.ssr.set(f, -1),
      fetchStale: if (s.fetching.get(f) >= 0) s.fetchStale.union(Set(f)) else s.fetchStale,
      cached: if (C.contains(f)) s.cached.set(f, NONE) else s.cached }
    markStale(s1, C.filter(c => c == f or (f == "tokens" and s.clientImports.contains(c))))
  }

  // Our hotUpdate hook, then Vite's updateModules. Its HMR invalidation drops the cached results but leaves
  // lastInvalidationTimestamp alone; the fix also invalidates in-flight transforms and marks them.
  pure def doHotUpdate(s: S, f: str): S = {
    val inflight = if (FIX) SLOTS.filter(i => inHook(s.txs.get(i))).map(i => s.txs.get(i).c).exclude(Set("")) else Set()
    val affected = (if (f == "tokens") s.depsOf else Set(f)).union(inflight)
    val s1 = { ...s, hot: s.hot.exclude(Set(f)), cached: C.mapBy(c => if (affected.contains(c)) NONE else s.cached.get(c)),
      reloads: if (FIX) 0 else s.reloads + 1 }
    if (FIX) markStale(s1, affected) else s1
  }

  // The ssr transform of a runner fetch finishes; ModuleRunner resets the node (invalidate: true).
  pure def doFetchDone(s: S, m: str): S = {
    val v = s.fetching.get(m)
    { ...s, fetching: s.fetching.set(m, -1), fetchStale: s.fetchStale.exclude(Set(m)),
      ssr: if (s.fetchStale.contains(m)) s.ssr else s.ssr.set(m, v),
      code: s.code.set(m, v), evaluated: s.evaluated.set(m, -1),
      txs: s.txs.keys().mapBy(i => { val t = s.txs.get(i); if (t.pend and m == (if (t.pc == "waitSelf") t.c else "tokens")) { ...t, pend: false } else t }) }
  }

  // A request of a client module that is not cached and has no in-flight transform Vite would reuse: Vite
  // loads the file and calls our transform hook.
  pure def doRequest(s: S, c: str, i: int): S = {
    val t = { ...FREE, c: c, pc: if (FIX) "lock" else "self", src: s.disk.get(c), ticket: s.tickets }
    val s1 = { ...setTx(s, i, t), tickets: s.tickets + 1, seen: s.seen.union(Set(c)) }
    if (FIX) s1 // evaluate() runs in the queue, see "lock"
    else { ...s1, sites: s.sites.set(c, NONE), code: s.code.set(c, -1), evaluated: s.evaluated.set(c, -1) }
  }
  pure def canRequest(s: S, c: str, i: int): bool = and {
    s.txs.get(i).pc == "free", i < 2, s.cached.get(c) == NONE,
    not(SLOTS.exists(j => s.txs.get(j).c == c and inHook(s.txs.get(j)) and not(s.txs.get(j).stale) and j < 2)),
  }

  // ---- one transform (slots 0, 1) or the runner's HMR re-import of its entrypoints (slot 2)

  // runner.cachedModule(m): join a fetch in flight, take the ssr graph's result, or start an ssr transform.
  pure def fetch(s: S, t: Tx, m: str, pc: str): (S, Tx) =
    if (s.fetching.get(m) >= 0) (s, { ...t, pc: pc, want: s.fetching.get(m), pend: true })
    else if (s.ssr.get(m) >= 0) ({ ...s, code: s.code.set(m, s.ssr.get(m)) }, { ...t, pc: pc, want: s.ssr.get(m) })
    else ({ ...s, fetching: s.fetching.set(m, s.disk.get(m)) }, { ...t, pc: pc, want: s.disk.get(m), pend: true })

  // A fetch resolves to the runner's node for m, which later fetches update in place; after a clear the
  // transform still holds the node it got.
  pure def nodeCode(s: S, t: Tx, m: str): int = if (s.code.get(m) >= 0) s.code.get(m) else t.want

  pure def txEnabled(s: S, i: int): bool = {
    val t = s.txs.get(i)
    if (t.pc == "lock") not(SLOTS.exists(j => holdsLock(s.txs.get(j)))) and
      SLOTS.forall(j => s.txs.get(j).pc != "lock" or s.txs.get(j).ticket >= t.ticket)
    else if (t.pc == "waitSelf") not(t.pend) and s.evaluated.get(t.c) != -2
    else if (t.pc == "waitTokens") not(t.pend)
    else t.pc != "free"
  }

  pure def txStep(s: S, i: int): S = {
    val t = s.txs.get(i)
    val hmr = i == 2
    if (t.pc == "lock") // evaluate() in the fix: its turn in the queue, then clear the runner and the sites
      setTx({ ...clear(s), sites: s.sites.set(t.c, NONE) }, i, { ...t, pc: "self" })
    else if (t.pc == "self") { val r = fetch(s, t, t.c, "waitSelf"); setTx(r._1, i, r._2) }
    else if (t.pc == "waitSelf") // cachedRequest: evaluated exports are reused, the body does not run again
      if (s.evaluated.get(t.c) >= 0) setTx(s, i, { ...t, pc: "read" })
      else setTx({ ...s, evaluated: s.evaluated.set(t.c, -2) }, i, { ...t, pc: "tokens", self: nodeCode(s, t, t.c) })
    else if (t.pc == "tokens") { val r = fetch(s, t, "tokens", "waitTokens"); setTx(r._1, i, r._2) }
    else if (t.pc == "waitTokens") { // tokens evaluated if needed, then the css file's body runs __site
      val tv = if (s.evaluated.get("tokens") >= 0) s.evaluated.get("tokens") else nodeCode(s, t, "tokens")
      val used = { src: -1, self: t.self, tokens: tv }
      setTx({ ...s, sites: s.sites.set(t.c, used),
        evaluated: s.evaluated.set("tokens", tv).setBy(t.c, e => if (e == -2) t.self else e) }, i, { ...t, pc: "read", tokens: tv })
    }
    else if (t.pc == "read") // runner.import resolved: read the sites, record depsOf, return the code
      if (hmr) setTx(s, i, if (t.c == "card" and s.seen.contains("button")) { ...FREE, c: "button", pc: "self" } else FREE)
      else if (s.sites.get(t.c).self < 0) setTx(s, i, FREE) // "site n was not evaluated": an error, nothing cached
      else setTx(record({ ...s, depsOf: s.depsOf.union(Set(t.c)) }, t.c, s.sites.get(t.c)), i,
        { ...t, pc: "cache", self: s.sites.get(t.c).self, tokens: s.sites.get(t.c).tokens })
    else // "cache": the rest of Vite's pipeline, then transformRequest caches unless invalidated meanwhile
      setTx({ ...s, clientImports: s.clientImports.union(Set(t.c)),
        cached: if (t.stale) s.cached else s.cached.set(t.c, { src: t.src, self: t.self, tokens: t.tokens }) }, i, FREE)
  }

  // The runner's HMR client handles one full-reload at a time: clear, then import the entrypoints again.
  pure def reloadEnabled(s: S): bool = s.reloads > 0 and s.txs.get(2).pc == "free"
  pure def doReload(s: S): S = {
    val s1 = { ...clear(s), reloads: s.reloads - 1 }
    val first = if (s.seen.contains("card")) "card" else "button"
    if (s.seen == Set()) s1 else setTx(s1, 2, { ...FREE, c: first, pc: "self" })
  }

  // record(): a changed rule set invalidates the sheet, softly, so a sheet request in flight is not cached either.
  pure def record(s: S, c: str, r: Out): S =
    if (s.rules.get(c) == r) s
    else { ...s, rules: s.rules.set(c, r), sheet: { ...s.sheet, ok: false }, sheetTx: { ...s.sheetTx, stale: true } }

  // A sheet request: load() reads the rules at once, the rest of Vite's pipeline caches it unless invalidated.
  pure def doSheetLoad(s: S): S = { ...s, sheetTx: { busy: true, stale: false, rules: s.rules } }
  pure def doSheetCache(s: S): S =
    { ...s, sheetTx: { ...s.sheetTx, busy: false }, sheet: if (s.sheetTx.stale) s.sheet else { ok: true, rules: s.sheetTx.rules } }

  // ---- invariants

  pure def quiescent(s: S): bool = and {
    SLOTS.forall(i => s.txs.get(i).pc == "free"), s.watch == Set(), s.hot == Set(),
    FILES.forall(f => s.fetching.get(f) < 0), not(s.sheetTx.busy),
  }
  // Main: once nothing is in flight, every module serves what its sources say (a module that is not cached
  // is transformed again on its next request).
  pure def fresh(s: S): bool = quiescent(s) implies
    C.forall(c => s.cached.get(c) == NONE or s.cached.get(c) == { src: s.disk.get(c), self: s.disk.get(c), tokens: s.disk.get("tokens") })
  // A transform reads the sites its own evaluation wrote: no other evaluation deleted or overwrote them.
  pure def ownSites(s: S): bool =
    0.to(1).forall(i => { val t = s.txs.get(i); t.pc == "read" and t.self >= 0 implies s.sites.get(t.c).self == t.self and s.sites.get(t.c).tokens == t.tokens })
  // wyw's bug: every module that serves a result is known to hotUpdate as an importer of tokens.
  pure def depsKnown(s: S): bool = C.forall(c => s.cached.get(c) != NONE implies s.depsOf.contains(c))

  // The sheet: once nothing is in flight, every module that serves a result has its rules in the sheet (a sheet
  // that is not cached loads the rules on its next request).
  pure def sheetOk(s: S): bool = quiescent(s) implies C.forall(c => s.cached.get(c) != NONE implies and {
    s.rules.get(c).self == s.cached.get(c).self, s.rules.get(c).tokens == s.cached.get(c).tokens,
    s.sheet.ok implies s.sheet.rules.get(c) == s.rules.get(c),
  })

  var s: S
  val servedFresh = fresh(s)
  val readsOwnSites = ownSites(s)
  val depsOfKnown = depsKnown(s)
  val sheetFresh = sheetOk(s)
  // witness: servedFresh is not vacuous
  val settledAfterEdits = quiescent(s) and s.disk.get("tokens") > 0 and C.forall(c => s.cached.get(c) != NONE)
  // witness: sheetFresh is not vacuous
  val sheetServed = settledAfterEdits and s.sheet.ok

  action init = s' = init0

  // ---- every await is a step
  action editFile = { nondet f = FILES.oneOf() all { s.disk.get(f) < MAXV, s' = doEdit(s, f) } }
  action fileChange = { nondet f = FILES.oneOf() all { s.watch.contains(f), s' = doFileChange(s, f) } }
  action hotUpdate = { nondet f = FILES.oneOf() all { s.hot.contains(f), s' = doHotUpdate(s, f) } }
  action request = { nondet c = C.oneOf() nondet i = SLOTS.oneOf() all { canRequest(s, c, i), s' = doRequest(s, c, i) } }
  action fetchDone = { nondet f = FILES.oneOf() all { s.fetching.get(f) >= 0, s' = doFetchDone(s, f) } }
  action transform = { nondet i = SLOTS.oneOf() all { txEnabled(s, i), s' = txStep(s, i) } }
  action runnerReload = all { reloadEnabled(s), s' = doReload(s) }
  action sheetLoad = all { not(s.sheet.ok), not(s.sheetTx.busy), s' = doSheetLoad(s) }
  action sheetCache = all { s.sheetTx.busy, s' = doSheetCache(s) }
  action step = any { editFile, fileChange, hotUpdate, request, fetchDone, transform, runnerReload, sheetLoad, sheetCache }

  // ---- model-based test (spec/mbt.mjs): the driver controls edits, watcher events, requests and when an ssr
  // transform finishes; in between the server runs until everything waits for one of those.
  pure def settle(s0: S): S = 0.to(20).fold(s0, (a, _) => SLOTS.fold(a, (b, i) => if (txEnabled(b, i)) txStep(b, i) else b))
  action mbtEdit = { nondet f = FILES.oneOf() all { s.disk.get(f) < MAXV, s' = doEdit(s, f) } }
  action mbtWatch = { nondet f = FILES.oneOf() all { s.watch.contains(f), s' = settle(doHotUpdate(doFileChange(s, f), f)) } }
  action mbtRequest = { nondet c = C.oneOf() all { canRequest(s, c, 0) or canRequest(s, c, 1),
    s' = settle(doRequest(s, c, if (canRequest(s, c, 0)) 0 else 1)) } }
  action mbtFetchDone = { nondet f = FILES.oneOf() all { s.fetching.get(f) >= 0, s' = settle(doFetchDone(s, f)) } }
  action mbtStep = any { mbtEdit, mbtWatch, mbtRequest, mbtFetchDone }
}

module fixed { import runner(FIX = true).* }
module original { import runner(FIX = false).* }
