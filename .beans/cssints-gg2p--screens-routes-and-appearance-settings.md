---
# cssints-gg2p
title: Screens, routes and appearance settings
status: todo
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T14:20:14Z
parent: cssints-co8y
blocked_by:
    - cssints-t5g6
    - cssints-uifu
---

## Question

With the data layer and Mu's layout known, decide with the user: the screens (home feed, profile with its tabs, thread, maybe a feed page) and their URLs (mirror bsky.app: `/profile/:handle`, `/profile/:handle/post/:rkey`), the router (Solid Router 2.0 or a few lines of our own), which feed the home shows, which embeds are in the first version, the appearance settings (hue slider, light/dim/dark, square-ish UI, square avatars, hidden metrics) and where they are kept (localStorage), and which cssints feature each screen shows off. Then cut the implementation tickets.
