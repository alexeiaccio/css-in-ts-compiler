---
# cssints-ezeh
title: 'windowsplitter: a host write of MIN during a pending collapse is indistinguishable'
status: todo
type: bug
tags:
    - headless
created_at: 2026-11-20T20:07:03Z
updated_at: 2026-11-20T20:07:03Z
---

## Why

`packages/headless/src/windowsplitter.ts` carries a `ponytail:` marker: in controlled mode `collapsed` is derived from the host value plus the last collapse request, so a direct host write of `MIN` while a collapse is pending is indistinguishable from an accepted collapse.

## What

Add a `collapse` prop (or an explicit request/commit channel) so a controlled host can say "collapsed" as data, and delete the marker. Until then the primitive is only correct for a host that steers through its own API, which is documented in the comment.

Found by the comment audit of 2026-11-20 (`/delete-comment`): the only excuse-shaped comment in the repository.
