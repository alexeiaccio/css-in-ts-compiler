// APG Breadcrumb — https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
//
// A trail of links to the parent pages of the current page, in hierarchical
// order; the current page is the LAST item. The APG contract the machine
// checks, as the trail changes while the user navigates:
//   - the link to the current page carries aria-current="page";
//   - if the current item is not a link, aria-current is optional;
//   - aria-current never sits on an ancestor (at most one item, and it is the
//     last one).
// The navigation landmark + its label are a static DOM contract, see
// specs/apg/STATIC.md. Keyboard: not applicable (plain links).
//
// Events:
//   descend             the user goes one level deeper (a new last item)
//   ancestor            the user follows an ancestor link; the trail is cut
//                       back to that item, which becomes the current page
//   renderLink / renderText   the current item is a link / plain text
//   toggleMark          optional aria-current on a non-link current item
//
// currentIndex: 1-based index of the item with aria-current="page" (0 = none).
module apg_breadcrumb {
  var depth: int          // items in the trail (the current page is item `depth`)
  var currentIsLink: bool // the last item is rendered as a link
  var currentIndex: int   // item carrying aria-current=page (0 = none)
  var navigations: int    // ancestor links followed

  def deeper: int = if (depth < 4) depth + 1 else depth
  def cutTo(t: int): int = if (t < depth) t else depth
  def remark(d: int): int = if (currentIndex == 0) 0 else d

  action init = all {
    depth' = 1,
    currentIsLink' = true,
    currentIndex' = 1,
    navigations' = 0
  }

  action descend = all {
    depth' = deeper,
    currentIsLink' = currentIsLink,
    currentIndex' = remark(deeper),
    navigations' = navigations
  }

  action ancestor = {
    nondet target = Set(1, 2, 3).oneOf()
    all {
      depth' = cutTo(target),
      currentIsLink' = currentIsLink,
      currentIndex' = remark(cutTo(target)),
      navigations' = if (target < depth) navigations + 1 else navigations
    }
  }

  action renderLink = all {
    depth' = depth,
    currentIsLink' = true,
    currentIndex' = depth,
    navigations' = navigations
  }

  action renderText = all {
    depth' = depth,
    currentIsLink' = false,
    currentIndex' = currentIndex,
    navigations' = navigations
  }

  action toggleMark = all {
    depth' = depth,
    currentIsLink' = currentIsLink,
    currentIndex' = if (currentIsLink) currentIndex else if (currentIndex == 0) depth else 0,
    navigations' = navigations
  }

  action step = any { init, descend, ancestor, renderLink, renderText, toggleMark }

  // APG: aria-current=page is on the last item or absent, never on an ancestor
  val CurrentIsLastOrAbsent: bool = or(currentIndex == 0, currentIndex == depth)
  // APG: the link to the current page always has aria-current=page
  val LinkCurrentIsMarked: bool = or(not(currentIsLink), currentIndex == depth)
  // the trail always holds the current page
  val TrailNotEmpty: bool = depth >= 1
  // the trail is bounded
  val TrailBounded: bool = depth <= 4
  // the counter only grows from zero
  val NavigationsNonNegative: bool = navigations >= 0
}
