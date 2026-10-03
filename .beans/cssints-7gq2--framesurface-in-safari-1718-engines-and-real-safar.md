---
# cssints-7gq2
title: frame()/surface() in Safari 17/18 engines and real Safari
status: in-progress
type: task
created_at: 2026-10-03T12:48:57Z
updated_at: 2026-10-03T12:48:57Z
---

Asked by the user (2026-10-03); open since 0.2: a real Safari 17/18 hand check of cssints/frame and cssints/surface (and now the derived-token runtime). This Mac has Safari 26.3.1 on macOS 15.7.4; Safari 17/18 cannot be installed beside it. Run: real Safari 26 through safaridriver (WebDriver) if remote automation can be enabled; WebKit builds of the 17.x and 18.x lines through older playwright-core releases (as plugins.md §3.6 did for old Firefox/WebKit); report which ran. Check the runtime decisions (needed(), lacking() exact), computed styles of frame() embeds and surface() layers in apps/sky and the test:browsers fixtures, and screenshots. State precisely what still needs a human with a real device (iOS Safari 17/18).
