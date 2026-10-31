import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { Pagination, PaginationContent, PaginationStatus } from "./pagination.tsx";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

const mountPagination = (options: { page: number; pageCount: number }) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [page, setPage] = createSignal(options.page);
  const dispose = render(
    () => (
      <Pagination
        page={page()}
        pageCount={options.pageCount}
        onPageChange={setPage}
        labels={{ nav: "Issue pages" }}
      >
        <PaginationContent />
        <PaginationStatus />
      </Pagination>
    ),
    root,
  );
  return {
    root,
    page,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const current = (root: HTMLElement): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-part="pagination-link"][aria-current="page"]');
const links = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="pagination-link"]'),
];
const byText = (root: HTMLElement, text: string): HTMLElement | undefined =>
  links(root).find((link) => link.textContent === text);

describe("Pagination skin", () => {
  it("marks the current page aria-current and paints it, and leaves the others plain", () => {
    const { root, dispose } = mountPagination({ page: 2, pageCount: 5 });
    expect(
      root.querySelector<HTMLElement>('[data-part="pagination"]')?.getAttribute("aria-label"),
    ).toBe("Issue pages");
    const marked = current(root);
    expect(marked?.textContent).toBe("2");
    expect(root.querySelectorAll('[data-part="pagination-link"][aria-current="page"]').length).toBe(
      1,
    );
    // painted from the attribute: the current page is bolder and on the highlight
    expect(getComputedStyle(marked as HTMLElement).fontWeight).toBe("500");
    expect(getComputedStyle(marked as HTMLElement).backgroundColor).not.toBe(
      getComputedStyle(byText(root, "3") as HTMLElement).backgroundColor,
    );
    expect(getComputedStyle(byText(root, "3") as HTMLElement).fontWeight).not.toBe("500");
    dispose();
  });

  it("moves the current page with next and previous, and keeps the ends in place when disabled", async () => {
    const { root, page, dispose } = mountPagination({ page: 1, pageCount: 5 });
    const previous = root.querySelector<HTMLElement>('[data-part="pagination-previous"]');
    expect(previous?.getAttribute("aria-disabled")).toBe("true");
    expect(getComputedStyle(previous as HTMLElement).cursor).toBe("not-allowed");

    root.querySelector<HTMLElement>('[data-part="pagination-next"]')?.click();
    await tick();
    expect(page()).toBe(2);
    expect(current(root)?.textContent).toBe("2");
    expect(root.querySelector('[data-part="pagination-status"]')?.textContent).toBe("Page 2 of 5");
    expect(previous?.getAttribute("aria-disabled")).toBeNull();

    previous?.click();
    await tick();
    expect(page()).toBe(1);
    expect(current(root)?.textContent).toBe("1");
    // the control is still there at the first page: the primitive keeps the ends, it does not remove them
    expect(previous?.isConnected).toBe(true);
    dispose();
  });

  it("an ellipsis is a gap, not a control", () => {
    const { root, dispose } = mountPagination({ page: 6, pageCount: 12 });
    const gaps = [...root.querySelectorAll<HTMLElement>('[data-part="pagination-gap"]')];
    expect(gaps.length).toBe(2);
    for (const gap of gaps) {
      expect(gap.querySelector("a, button")).toBeNull();
      expect(gap.querySelector('[aria-hidden="true"]')?.textContent).toBe("…");
      expect(gap.hasAttribute("tabindex")).toBe(false);
    }
    const shown = links(root).map((link) => link.textContent);
    expect(shown).toEqual(["1", "5", "6", "7", "12"]);
    dispose();
  });

  it("announces the count once, in the primitive's status region", () => {
    const { root, dispose } = mountPagination({ page: 2, pageCount: 9 });
    const status = root.querySelector<HTMLElement>('[data-part="pagination-status"]');
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent).toBe("Page 2 of 9");
    expect(root.querySelectorAll('[role="status"]').length).toBe(1);
    dispose();
  });
});
