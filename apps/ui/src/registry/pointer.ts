import { afterEach } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

/**
 * The pointer is shared by every test in a page and by every page of the run, and
 * a widget that appears under it receives a `mouseover`/`mouseenter` it never
 * asked for: a toast's countdown pauses (and never resumes), a menu focuses the
 * row that appeared under a pointer the walk never moved. Neither is behaviour
 * the model asked for, and which row is under the pointer is not a fact a test
 * can state.
 *
 * So the pointer is parked between tests on a fixed, top-most 1 px element in the
 * corner of the viewport: the next test's widget can be anywhere, and the
 * pointer is over this element, not over the widget.
 */
const PARK_ID = "vitest-pointer-park";

const park = (): HTMLElement => {
  const existing = document.getElementById(PARK_ID);
  if (existing !== null) {
    return existing;
  }
  const element = document.createElement("div");
  element.id = PARK_ID;
  element.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;z-index:2147483647;pointer-events:auto;";
  document.documentElement.append(element);
  return element;
};

afterEach(async () => {
  await userEvent.hover(park());
});
