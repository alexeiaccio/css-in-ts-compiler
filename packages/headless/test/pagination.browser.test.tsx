import { createPagination } from "../src/pagination";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vite-plus/test";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
import { render } from "@solidjs/web";

const mount = (options: Parameters<typeof createPagination>[0]) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [page, setPage] = createSignal(options.page);
  const dispose = render(() => {
    const pagination = createPagination({
      ...options,
      get page() {
        return page();
      },
      onPageChange: (next) => {
        setPage(next);
        options.onPageChange?.(next);
      },
    });
    return (
      <>
        <nav {...pagination.navProps}>
          <ul {...pagination.listProps}>
            <li {...pagination.itemProps(Math.max(page() - 1, 1))}>
              <a {...pagination.previousProps}>Previous</a>
            </li>
            {pagination.items().map((item) =>
              item.kind === "gap" ? (
                <li data-gap={item.key}>
                  <span aria-hidden="true">…</span>
                </li>
              ) : (
                <li {...pagination.itemProps(item.page)}>
                  <a {...pagination.linkProps(item.page)}>{item.page}</a>
                </li>
              ),
            )}
            <li {...pagination.itemProps(page() + 1)}>
              <a {...pagination.nextProps}>Next</a>
            </li>
          </ul>
        </nav>
        <p {...pagination.statusProps}>{pagination.status()}</p>
      </>
    );
  }, root);
  return {
    root,
    page,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createPagination", () => {
  it("marks exactly one page current, and it is not a link target", () => {
    const { root, dispose } = mount({ page: 5, pageCount: 12 });
    const current = root.querySelectorAll('[aria-current="page"]');
    expect(current.length).toBe(2); // the item and its link share the mark
    const links = [...root.querySelectorAll("ul > li > a")];
    expect(links.filter((a) => a.getAttribute("aria-current") === "page")[0]?.textContent).toBe(
      "5",
    );
    expect(root.querySelector<HTMLElement>("nav")?.getAttribute("aria-label")).toBe("Pagination");
    dispose();
  });

  it("lists the boundaries, the neighbours and one gap per elided run", () => {
    const { root, dispose } = mount({ page: 6, pageCount: 12, siblings: 1 });
    const pages = [...root.querySelectorAll("ul > li > a")]
      .map((a) => a.textContent)
      .filter((text) => text !== "Previous" && text !== "Next");
    expect(pages).toEqual(["1", "5", "6", "7", "12"]);
    expect(root.querySelectorAll("[data-gap]").length).toBe(2);
    expect(root.textContent).toContain("Page 6 of 12");
    dispose();
  });

  it("keeps the ends in place and disables them at the boundary", async () => {
    const { root, page, dispose } = mount({ page: 1, pageCount: 3 });
    const previous = root.querySelector<HTMLAnchorElement>("a[rel=prev]");
    expect(previous?.getAttribute("aria-disabled")).toBe("true");
    previous?.click();
    await tick();
    expect(page()).toBe(1);
    root.querySelector<HTMLAnchorElement>("a[rel=next]")?.click();
    await tick();
    expect(page()).toBe(2);
    dispose();
  });

  it("announces the count once, in a polite status region", () => {
    const { root, dispose } = mount({ page: 2, pageCount: 9 });
    const status = root.querySelector('[role="status"]');
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent).toBe("Page 2 of 9");
    expect(root.querySelectorAll('[role="status"]').length).toBe(1);
    dispose();
  });

  it("passes an href through when the host has one, so the control works without JS", () => {
    const { root, dispose } = mount({
      page: 2,
      pageCount: 5,
      hrefFor: (page) => `/issues?page=${page}`,
    });
    expect(root.querySelector<HTMLAnchorElement>("a[rel=next]")?.getAttribute("href")).toBe(
      "/issues?page=3",
    );
    dispose();
  });

  it("takes its labels from the host", () => {
    const { root, dispose } = mount({
      page: 1,
      pageCount: 3,
      labels: {
        nav: "Страницы",
        previous: "Назад",
        next: "Вперёд",
        status: (page, count) => `Страница ${page} из ${count}`,
      },
    });
    expect(root.querySelector<HTMLElement>("nav")?.getAttribute("aria-label")).toBe("Страницы");
    expect(root.textContent).toContain("Страница 1 из 3");
    dispose();
  });
});
