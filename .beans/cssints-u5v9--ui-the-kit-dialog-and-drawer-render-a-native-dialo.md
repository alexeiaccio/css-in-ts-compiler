---
# cssints-u5v9
title: 'ui: the kit dialog and drawer render a native dialog'
status: completed
type: task
priority: normal
created_at: 2026-11-15T13:27:22Z
updated_at: 2026-11-15T14:17:44Z
parent: cssints-oeb0
---

## What
The primitives accept a native dialog (nativeProps + attachDialog on createDialogModal, createDrawer and createConfirm),
and the kit still renders its own overlay: a positioned layer, a backdrop div and the JS motion machine
(overlay-motion.ts). Render the dialog element where it exists — ::backdrop replaces the div, showModal() the trap and the
lock, and @starting-style + transition-behavior: allow-discrete replace the enter/leave tracks — and keep the motion
machine only for the fallback.

## Todo
- [ ] Dialog and Drawer stories on the dialog element with the platform backdrop and an @starting-style entry; the
      conformance tests move the platform-owned assertions to the host fixture
- [ ] overlay-motion stays as the fallback path (engines without showModal, and the reduced-motion check)
