import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, colorScheme, global, media } from "cssints" with { type: "cssints" };

import { Feed } from "./feed.tsx";
import { Post } from "./post.tsx";
import { Header, Shell } from "./shell.tsx";
import { posts } from "./posts.ts";
import { t } from "./theme.ts" with { type: "cssints" };

// csssky's home screen (apps/csssky), cut to a slice: the theme, the shell, a feed of cards, and the posts from the fixtures
// that the app's tests use. The entry does what a project's entry does once: the reset, which sits in a layer below every other
// style, and the colour of the page.
reset();
global("html", bg(t.color.bg));
global(":root", colorScheme("light"));
global(":root.dim, :root.dark", colorScheme("dark"));
global(":root:not(.light)", media("(prefers-color-scheme: dark)")(colorScheme("dark")));

export default function App() {
  return (
    <Shell>
      <Header title="Home" />
      <Feed>
        {posts.map((post) => (
          <Post post={post} />
        ))}
      </Feed>
    </Shell>
  );
}
