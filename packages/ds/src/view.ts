import type { Args } from "@cssints/stories";

/** The values a story renders with: the loader's own `Args`. */
export type { Args };

/** What the page and the detached panels tell each other. */
export type Message =
  | { readonly type: "story"; readonly id: string }
  | { readonly type: "args"; readonly args: Args }
  | { readonly type: "detached"; readonly on: boolean };

/** Two documents of one storybook, whichever window they are in. */
export interface Channel {
  send(message: Message): void;
  listen(receive: (message: Message) => void): () => void;
}

const NAME = "cssints-ds-storybook";

/**
 * The channel of the page and its panels window: `BroadcastChannel`, which reaches every same-origin document of the name —
 * the page, a popped window, and a second tab that opened the same URL.
 *
 * @returns {Channel} the channel
 */
export const channel = () => {
  const bus = new BroadcastChannel(NAME);
  return {
    send: (message: Message) => bus.postMessage(message),
    listen: (receive: (message: Message) => void) => {
      const handler = (event: MessageEvent<Message>) => receive(event.data);
      bus.addEventListener("message", handler);
      return () => bus.removeEventListener("message", handler);
    },
  };
};

/** A view of a storybook document: which story, and which half of the chrome. */
export interface View {
  readonly story: string | undefined;
  readonly panels: "both" | "rail" | "canvas";
}

/**
 * The view a document's URL asks for: `?story=button--accent`, and `?panels=rail` in the window the panels were popped into.
 *
 * @param {string} search the URL's search
 * @param {"both" | "rail" | "canvas"} fallback the half when the URL does not say
 * @returns {View} the story id and the half
 */
export const parseView = (search: string, fallback: "both" | "rail" | "canvas") => {
  const query = new URLSearchParams(search);
  const panels = query.get("panels");
  return {
    story: query.get("story") ?? undefined,
    panels: panels === "rail" || panels === "canvas" ? panels : fallback,
  };
};

/**
 * The URL a story is drawn at.
 *
 * @param {string} path the document's path
 * @param {string} id the story id
 * @param {"both" | "rail" | "canvas"} panels the half
 * @returns {string} the URL
 */
export const viewUrl = (path: string, id: string, panels: "both" | "rail" | "canvas") => {
  const query = new URLSearchParams({ story: id });
  if (panels !== "both") {
    query.set("panels", panels);
  }
  return `${path}?${query.toString()}`;
};
