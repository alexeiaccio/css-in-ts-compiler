# Edges: what a subway map knows

Read 2026-11-28, for the routing slice of the layered-layout epic (`cssints-i6pb`) and the diagram starter (`cssints-osne`).
Two sources: Tom MacWright's thread about the routing in his diagram tool (Nov 2026), and the two papers the replies to it
name. The layout half of the epic is about where nodes go; this is about the lines between them, which is a different
literature with a good picture to aim at.

## The north star: bundling and overlap reduction

From the thread, on what the routing is trying to be:

> one of the north stars is edge bundling _and_ overlap reduction, ala good subway maps. right now i'm doing a\* routing,
> routing the shortest paths first, and adding to the weights for each line to try and avoid grid tiles touched by the
> previous line

and, a day later:

> this a\* routing + path weights solution is surprisingly great ROI - not much fancy math but just 'automatically' is doing
> stuff like avoiding path crossings here.

A subway map is not an algorithm. It is a set of goals for edges: lines that share a corridor are drawn **once and together**,
parallel lines do not overlap, crossings are rare and mostly at right angles, and every line runs in a small set of directions.
That is a sharper statement of what our routing bean had as an invariant ("no two routes share a segment — or they are grouped
into one and drawn once"): the grouping is the point, not the exception.

## Octilinear, not orthogonal

Metro maps use eight directions — multiples of 45° — and the drawing literature calls that **octilinear**, or C-oriented,
drawing. The reply that names it points at Philipp Kindermann's lecture _Octilinear Graph Drawing: Metro Map Layout_ (Uni
Trier, graphvis SS21). The problem shape there: the topology (which line meets which, and in what order) is given, the
coordinates are the answer, and the quality measures are straightness (bends are expensive), angular resolution at the
vertices, and bounded edge lengths. It is NP-hard, so the literature has heuristics and exact small-instance programs.

This is a real constraint on our router, which was planned as **orthogonal** only. Orthogonal is the four-direction special
case: the invariants ("every segment is horizontal or vertical") become "every segment is a multiple of 45°", and the drawing
gains what makes a metro map readable at the price of a coarser collision test (a diagonal crosses a box's corners). The
decision to take now is about the _type_, not the first implementation: a route that can only hold axis-aligned segments
forecloses octilinear. So: start orthogonal, keep octilinear as a second strategy behind the same polyline, and say so before
the type is fixed.

## A\* with weights, and the bundling it gives for free

The recipe in the thread is one loop over a coarse lattice: route the shortest paths first, then raise the weight of the tiles
the earlier lines used, so each next line prefers an unused corridor. The reported effect is exactly the two goals above —
crossings avoided and corridors starting to bundle — with "not much fancy math": the whole policy is a weight table. For us
that is attractive because it needs no channel bookkeeping and no dummy-node geometry (the dummy slots of
`graph-layout-slots.qnt` are a structure the router can use, not a structure it must reproduce), and because every goal —
crossings, overlaps, node avoidance — becomes a number in that table.

## The exact reference, which is not a dependency

Nöllenburg and Wolff, _A Mixed-Integer Program for Drawing High-Quality Metro Maps_ (GD 2005), formulates the octilinear map
as an integer program — the eight directions, angular resolution, edge lengths and straightness as constraints — and solves
small instances optimally. It is the quality oracle, not something to ship: a solver dependency, and instances the size of a
transit map. Like ELK, it belongs in this note, and at most in a fixture that says what "good" means.

## Taken

- For `cssints-i6pb`: the goal is bundling and overlap reduction, not merely "no overlaps" — shared corridors are drawn once.
- The first implementation is A\* over a lattice with per-line weight inflation, because its return is reported and it needs
  no channel bookkeeping; the orthogonal channel router stays as the reference its results are checked against. _Both halves
  of that were partly wrong when built: it needed the channel bookkeeping after all, and the inflation separates lines instead
  of bundling them — the section below has the numbers._
- The route type is a polyline of points, and the router's invariants are stated per direction set, so octilinear is a
  strategy rather than a rewrite.
- Octilinear as the named second strategy, and the metro map's quality measures (bends, angular resolution, edge lengths) as
  the numbers to record when it lands.

## What the implementation found (2026-11-28)

The four items above were built in this order, and three of them changed the plan they came from; the numbers are in
[`docs/wayfinder.md`](../wayfinder.md), one entry per slice.

**Octilinear is a type, not a gain.** `directions: 8` moves a bend rather than removing it: a jog becomes one 45° segment, the
same two corners at a smaller angle. Over the corpus it shortens the drawing 1.3% and leaves the bend count at 730 either way,
while its wider sweep raises the drawn crossings from 168 to 174. It stays because it defines what the A\* result is allowed
to be, and because the default costs nothing.

**The channel bookkeeping stayed.** This note expected the A\* to need none; it needs one. The lattice is built per layer
boundary — the strip between two layers, which is free of boxes by construction — because that is what keeps a route monotone
in x, keeps one crossing per boundary between an edge's ends, and leaves the ports and the band heights (the dummies) exactly
where the channel router put them; a whole-drawing lattice would have had to re-solve both. The channel router remains the
reference the lattice is compared against, in the same suite.

**The per-line weight separates, it does not bundle.** The sweep over the corpus (`wReuse` 0, 2, 5, 10 against `wCross` 0, 5,
20) is unambiguous: at 0 the drawing has 2 crossings and 170 bundled corridor pairs, at 2 it has 97 and 15, at 5 112 and 4, at
10 114 and 2. A positive price for a shared tile is an incentive to open a lane, so the inflation does the opposite of what the
thread reported. What does the bundling is the recipe's _other_ half — route the shortest paths first over a lattice whose rows
the drawing shares. `wCross` still earns its place at eight directions (13 crossings against 30 at 0), and the default pair is
(0, 20).

The result is a metro map at a price: 2 drawn crossings and 170 bundled pairs against the channel router's 168 and 5, 624 bends
against 730, the same 37 682 px, and nine times the pipeline time (506 µs a graph against 9.2 at four directions, 546 against 58
for the whole pipeline). The 200-node chain routes in 1.7 ms and the 200-node cycle in 5.4–6.9, both inside a frame; the dense
40-node graph takes 15.8–18.1 ms and is not claimed to be. That is why `router: "channels"` stays the default and the lattice an
option: the win is real, its price is the cost, and the weight table is not what buys it.

## Not taken

- The MIP as code: small instances, a solver, and our graphs are diagrams, not transit maps.
- Edge labels and control points — MacWright's own next items — are their own slot problem, deferred with ports and labels in
  `cssints-a65d`.
- Metro-map _topology morphing_ (a geographically true map redrawn schematically): our graphs arrive as boxes with an order,
  not as geography with a topology to preserve.

## Sources

- The thread: <https://bsky.app/profile/macwright.com/post/3n2yjtptwgk22> (edge/socket splaying), its parent
  <https://bsky.app/profile/macwright.com/post/3n2n7f6ir522e> (the A\* routing and the subway-map north star), and the
  replies that name the papers (theohonohan, rreusser).
- Kindermann, _Octilinear Graph Drawing: Metro Map Layout_, graphvis SS21, Uni Trier:
  <https://algo.uni-trier.de/lectures/graphvis/gv-ss21-13-metromaps-print.pdf>.
- Nöllenburg, Wolff, _A Mixed-Integer Program for Drawing High-Quality Metro Maps_, GD 2005:
  <https://www.semanticscholar.org/paper/A-Mixed-Integer-Program-for-Drawing-High-Quality-N%C3%B6llenburg-Wolff/bed9b437e14dea9ff6447a77cf40b9aaf551d2db>.
- The library landscape this sits in: [`graph-drawing.md`](graph-drawing.md).
