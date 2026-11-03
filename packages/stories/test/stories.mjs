// The loader on its own, with no DOM and no app: an entry's id, its merged args, the exports it skips, the order it sorts
// in, the view it builds (a component or a render), and the hash split. `createComponent` comes from solid-js's server
// build here, which calls a component and returns what it returns, so a view is checked without a renderer.
import assert from "node:assert/strict";

import { entries, parseHash, storyOfId } from "../src/index.ts";

const Button = (props) => ({ kind: "button", props });

const modules = {
  "../registry/button/button.stories.tsx": {
    default: {
      title: "Button",
      component: Button,
      args: { tone: "neutral", size: "md" },
      argTypes: { tone: { type: "select", options: ["neutral", "accent"] } },
    },
    Primary: { args: { tone: "accent", children: "Publish" } },
    // a render story: the view is the render, and the args it is given are its own
    Quiet: { args: { tone: "quiet" }, render: (args) => args },
    // a story's own controls, over the meta's
    Loaded: { argTypes: { tone: { type: "select", options: ["quiet"] } }, render: () => "loaded" },
    // what the plugin adds to a compiled module: not a story
    __cssints_hoisted: 1,
    $$moduleUrl: "/src/registry/button/button.stories.tsx",
  },
  "../registry/card/card.stories.tsx": {
    default: { title: "Card" },
    Default: { render: () => "card" },
  },
};

const stories = entries(modules);
assert.deepEqual(
  stories.map((story) => story.id),
  ["button--loaded", "button--primary", "button--quiet", "card--default"],
);
assert.deepEqual(
  stories.map((story) => story.item),
  ["button", "button", "button", "card"],
);

// the meta's args and the story's, the story's over them
const primary = stories[1];
assert.equal(primary.title, "Button");
assert.equal(primary.name, "Primary");
assert.deepEqual(primary.args, { tone: "accent", size: "md", children: "Publish" });
assert.deepEqual(primary.argTypes, { tone: { type: "select", options: ["neutral", "accent"] } });
// the meta's component is called through createComponent with the merged args
assert.deepEqual(primary.view(primary.args), {
  kind: "button",
  props: { tone: "accent", size: "md", children: "Publish" },
});
// a render story draws itself
assert.deepEqual(stories[2].view(stories[2].args), { tone: "quiet", size: "md" });
// a story declares controls of its own, over the meta's per arg
assert.deepEqual(stories[0].argTypes, { tone: { type: "select", options: ["quiet"] } });
// a story with no argTypes has none, and one with no story args takes the meta's (none here)
assert.deepEqual(stories[3].argTypes, {});
assert.deepEqual(stories[3].args, {});
assert.equal(stories[3].view({}), "card");

// the item can be named by the app instead of the path's directory
const flat = entries(
  {
    "./stories/disclosure.stories.tsx": { default: { title: "D" }, Closed: { render: () => "d" } },
  },
  (path) => path.slice("./stories/".length, -".stories.tsx".length),
);
assert.equal(flat[0].id, "disclosure--closed");

// a story with no render and a meta with no component is a broken file, named as such
assert.throws(
  () => entries({ "../registry/x/x.stories.tsx": { default: { title: "X" }, Only: {} } }),
  /has no render and its meta has no component/,
);

assert.equal(storyOfId(stories, "card--default")?.title, "Card");
assert.equal(storyOfId(stories, "card--missing"), undefined);

assert.deepEqual(parseHash("#button--primary"), { name: "button", story: "button--primary" });
assert.deepEqual(parseHash("#button"), { name: "button", story: undefined });
assert.deepEqual(parseHash(""), { name: "", story: undefined });
// a guide whose name holds a dash is not a story: the split is on the first `--`
assert.deepEqual(parseHash("#getting-started"), { name: "getting-started", story: undefined });

console.log("stories: ids, args, order, views and the hash split ok");
