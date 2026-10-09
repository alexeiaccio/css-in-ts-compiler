import { createRouter, defineRoute } from "@solidjs/router";

import Page from "./Page.tsx";
import { Shell } from "./Shell.tsx";

// One route per page: the slug is the path ("" is the overview); an unknown slug is the not-found page.
const Router = createRouter({
  base: import.meta.env.BASE_URL.replace(/\/$/, ""),
  routes: [
    { path: "/", component: () => <Page slug="" /> },
    defineRoute({ path: "/:slug", component: (props) => <Page slug={props.params.slug} /> }),
    { path: "*404", component: () => <Page slug="*" /> },
  ],
});

export default function App() {
  return <Router>{(props) => <Shell>{props.children}</Shell>}</Router>;
}
