import { createRouter, defineRoute } from "@solidjs/router";

import DevPosts from "./screens/DevPosts.tsx";
import Home from "./screens/Home.tsx";
import NotFound from "./screens/NotFound.tsx";
import Profile from "./screens/Profile.tsx";
import Thread from "./screens/Thread.tsx";

// the URLs of bsky.app
export const Router = createRouter({
  routes: [
    { path: "/", component: Home },
    defineRoute({
      path: "/profile/:handle",
      component: (props) => <Profile handle={props.params.handle} />,
    }),
    defineRoute({
      path: "/profile/:handle/post/:rkey",
      component: (props) => <Thread handle={props.params.handle} rkey={props.params.rkey} />,
    }),
    // every embed kind from recorded posts; the dev server only
    ...(import.meta.env.DEV ? [{ path: "/dev/posts", component: DevPosts }] : []),
    { path: "*404", component: NotFound },
  ],
});
