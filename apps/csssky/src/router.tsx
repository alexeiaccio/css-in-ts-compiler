import { createRouter, defineRoute } from "@solidjs/router";

import DevPosts from "./screens/DevPosts.tsx";
import NotFound from "./screens/NotFound.tsx";
import Profile from "./screens/Profile.tsx";
import Settings from "./screens/Settings.tsx";
import Thread from "./screens/Thread.tsx";

// The feed is the Shell's master pane (it stays mounted while a thread is open beside it), so "/" is only a path: the
// Shell draws Home for it, and for a thread with nothing else behind it.
const Feed = () => null;

// the URLs of bsky.app
export const Router = createRouter({
  routes: [
    { path: "/", component: Feed },
    defineRoute({
      path: "/profile/:handle",
      component: (props) => <Profile handle={props.params.handle} />,
    }),
    defineRoute({
      path: "/profile/:handle/post/:rkey",
      component: (props) => <Thread handle={props.params.handle} rkey={props.params.rkey} />,
    }),
    { path: "/settings", component: Settings },
    // every embed kind from recorded posts; the dev server only
    ...(import.meta.env.DEV ? [{ path: "/dev/posts", component: DevPosts }] : []),
    { path: "*404", component: NotFound },
  ],
});
