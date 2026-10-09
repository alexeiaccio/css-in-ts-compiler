import { createRouter, defineRoute } from "@solidjs/router";
import { lazy, Loading } from "solid-js";

import Page from "./Page.tsx";
import { Shell } from "./Shell.tsx";

// The playground is its own chunk: the engine and its parsers load when the page opens, never with the docs.
const Playground = lazy(() => import("./playground/Playground.tsx"));

// One route per page: the slug is the path ("" is the overview); an unknown slug is the not-found page.
const Router = createRouter({
  base: import.meta.env.BASE_URL.replace(/\/$/, ""),
  routes: [
    { path: "/", component: () => <Page slug="" /> },
    {
      path: "/playground",
      component: () => (
        <Loading fallback={<p>Loading the playground…</p>}>
          <Playground />
        </Loading>
      ),
    },
    defineRoute({ path: "/:slug", component: (props) => <Page slug={props.params.slug} /> }),
    { path: "*404", component: () => <Page slug="*" /> },
  ],
});

export default function App() {
  return <Router>{(props) => <Shell>{props.children}</Shell>}</Router>;
}
