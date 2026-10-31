// Drop zone: the drag state and the last delivery of a file drop target.
//
// NOT an APG pattern: there is no WAI-ARIA APG page for file dropping. The
// accessible contract is a `role=group` zone (named by `aria-label` or
// `aria-labelledby`), a real `<button>` that opens the hidden file input, and a
// `role=status` live region that announces the last batch. What has state that
// changes over time — and a known bug class, the highlight stuck on after a
// child's `dragleave` or a drop — is the drag depth and the delivery summary,
// so that is what this machine models. The place of a non-APG pattern is
// `specs/patterns/`, not `specs/apg/`: the APG directory is a contract with the
// APG pages and its scenarios are ports of upstream tests.
//
// Source of truth for the events: the HTML drag-and-drop model (`dragenter`,
// `dragover`, `dragleave`, `drop`, all bubbling, all cancelable) and MDN's
// `DataTransfer` (`items` with `kind === "file"`, `files`). A `dragenter` fires
// on the deepest element the pointer enters and bubbles, so the zone's handler
// counts every nesting level; a `dragleave` on a child bubbles too, so a single
// counter decides whether the pointer is still somewhere inside the zone. The
// primitive is `packages/headless/src/dropzone.ts` (`createDropZone`).
//
// MODELLED: `depth` 0..2 — 0 no drag inside the zone, 1 over the zone itself,
// 2 over a child of the zone. A grandchild is the same column as a child: only
// `depth > 0` is read (`dragging()`, the styling hook), so the model does not
// spend a value on how deep below the zone the pointer is. `dragging()` is its
// own var (`highlight`) so the invariant that ties it to the depth has teeth.
// A disabled zone ignores `dragenter`/`dragleave` (the handlers test
// `disabled`), and a drop clears the depth and then returns before it becomes a
// batch. `batch` is the last delivery's summary: "none" before one arrived,
// "accepted" or "rejected" after (the announcement reads its counts and
// reasons); `batches` counts deliveries, `dropped` marks "this action was a
// drop", `delivered` "this drop became a batch", `exited` "this dragleave was
// the zone's own and the zone honoured it".
//
// REQUEST VS COMMIT does not apply: the zone owns its drag state and its last
// summary, `onFiles` is a notification, not a controlled value. The only write
// from outside is the host's `disabled` prop (`set_disabled`).
//
// NOT MODELLED (each is a pure decision or the DOM's):
//   - The per-file decision (`accept` grammar, `maxSize`, `maxFiles`): a pure
//     function of one batch, checked by a property test next to the browser
//     test (`accepted + rejected === total`, one reason per refused file,
//     `accepted <= maxFiles`).
//   - The async upload: the host's `onFiles` does it; the primitive never sees
//     the result.
//   - The picker path: the browse button and the hidden input's `change` call
//     the same `deliver` with no drag state; drop(x) is the only delivery the
//     machine shows.
//   - A `dataTransfer` that is null, carries no file items, or holds only a
//     folder (`webkitGetAsEntry().isDirectory`): browser details the DOM test
//     covers; the empty drop here is the "no files" case, which changes no
//     summary and no depth.
//   - A second nested level (grandchild): the primitive's counter would read 3
//     and the model saturates at 2; the fixture has one child, so a leave is
//     never ambiguous.
//   - Pointer events inside the zone, `aria-disabled` on the button and the
//     input's own attributes: static DOM, asserted by the browser test.
//
// Generator gaps hit: no collections and no string selectors, so the three drop
// kinds are three actions and every action assigns every var.
module patterns_dropzone {
  var depth: int        // dragenter count inside the zone: 0, 1 (zone), 2 (child)
  var highlight: bool   // dragging(): what the skin reads
  var disabled: bool    // the host's disabled prop
  var batch: str        // last delivery summary: "none" | "accepted" | "rejected"
  var batches: int      // deliveries that became a batch
  var dropped: bool     // the last action was a drop (of any kind)
  var delivered: bool   // the last action delivered a batch
  var exited: bool      // the last action was the zone's own honoured dragleave

  def ZERO: int = 0
  def ONE: int = 1
  def MAXDEPTH: int = 2

  def isDragging(d: int): bool = d > ZERO
  def bumpUp(d: int): int = if (d < MAXDEPTH) d + ONE else MAXDEPTH
  def clampDown(d: int): int = if (d > ZERO) d - ONE else ZERO
  // the depth after a dragenter; a disabled zone ignores the event
  def entered(d: int, off: bool): int = if (off) d else bumpUp(d)
  // the depth after a dragleave on a child; a disabled zone ignores the event
  def leftDown(d: int, off: bool): int = if (off) d else clampDown(d)
  // the depth after the dragleave that leaves the zone itself
  def leftOut(d: int, off: bool): int = if (off) d else ZERO
  // a drop becomes a batch unless the zone is disabled; "none" is the empty transfer
  def delivers(off: bool, kind: str): bool = and(not(off), kind != "none")

  action init = all {
    depth' = ZERO,
    highlight' = false,
    disabled' = false,
    batch' = "none",
    batches' = ZERO,
    dropped' = false,
    delivered' = false,
    exited' = false
  }

  action enter_zone = all {
    depth' = entered(depth, disabled),
    highlight' = isDragging(entered(depth, disabled)),
    disabled' = disabled,
    batch' = batch,
    batches' = batches,
    dropped' = false,
    delivered' = false,
    exited' = false
  }

  action enter_child = all {
    depth' = entered(depth, disabled),
    highlight' = isDragging(entered(depth, disabled)),
    disabled' = disabled,
    batch' = batch,
    batches' = batches,
    dropped' = false,
    delivered' = false,
    exited' = false
  }

  action leave_child = all {
    depth' = leftDown(depth, disabled),
    highlight' = isDragging(leftDown(depth, disabled)),
    disabled' = disabled,
    batch' = batch,
    batches' = batches,
    dropped' = false,
    delivered' = false,
    exited' = false
  }

  action leave_zone = all {
    depth' = leftOut(depth, disabled),
    highlight' = isDragging(leftOut(depth, disabled)),
    disabled' = disabled,
    batch' = batch,
    batches' = batches,
    dropped' = false,
    delivered' = false,
    exited' = not(disabled)
  }

  action drop_accepted = all {
    depth' = ZERO,
    highlight' = false,
    disabled' = disabled,
    batch' = if (delivers(disabled, "accepted")) "accepted" else batch,
    batches' = if (delivers(disabled, "accepted")) batches + ONE else batches,
    dropped' = true,
    delivered' = delivers(disabled, "accepted"),
    exited' = false
  }

  action drop_rejected = all {
    depth' = ZERO,
    highlight' = false,
    disabled' = disabled,
    batch' = if (delivers(disabled, "rejected")) "rejected" else batch,
    batches' = if (delivers(disabled, "rejected")) batches + ONE else batches,
    dropped' = true,
    delivered' = delivers(disabled, "rejected"),
    exited' = false
  }

  // a transfer with no files: the drop clears the depth, nothing is announced
  action drop_empty = all {
    depth' = ZERO,
    highlight' = false,
    disabled' = disabled,
    batch' = batch,
    batches' = batches,
    dropped' = true,
    delivered' = false,
    exited' = false
  }

  action set_disabled = {
    nondet off = Set(true, false).oneOf()
    all {
      depth' = depth,
      highlight' = highlight,
      disabled' = off,
      batch' = batch,
      batches' = batches,
      dropped' = false,
      delivered' = false,
      exited' = false
    }
  }

  action step = any {
    init, enter_zone, enter_child, leave_child, leave_zone, drop_accepted, drop_rejected, drop_empty, set_disabled
  }

  // dragging() is exactly "the pointer is somewhere inside the zone"
  val DraggingIffDepth: bool = highlight == isDragging(depth)
  // a drop of any kind clears the highlight: the stuck-after-drop bug
  val DepthClearsOnDrop: bool = or(not(dropped), depth == ZERO)
  // the dragleave that leaves the zone clears it: the stuck-after-child-leave bug
  val DepthClearsOnExit: bool = or(not(exited), depth == ZERO)
  // a disabled zone never turns a drop into a batch, so it never announces one
  val DisabledNeverDelivers: bool = or(not(delivered), not(disabled))
  // a delivery comes from a drop and is one batch: a counter move and a summary
  val OneDropOneBatch: bool =
    or(not(delivered), and(dropped, and(batches >= ONE, batch != "none")))
  // a dragleave without a matching dragenter cannot underflow, and nesting stops at 2
  val DepthNeverNegative: bool = and(depth >= ZERO, depth <= MAXDEPTH)
  // a summary exists exactly after a delivery: an empty or disabled drop keeps the old one
  val AnnouncementOnlyAfterBatch: bool =
    or(and(batches == ZERO, batch == "none"), and(batches > ZERO, batch != "none"))
}
