---
"@cssints/headless": minor
---

`createVirtualizer`: a DOM virtualiser ported from the native renderer's window (`fixedWindow` / `measuredWindow`). The host renders only the visible rows plus an overscan and two gap-compensated spacers stand in for the rest, so the content height, the scroll's clamp and its thumb are the whole list's. A fixed `itemSize` is arithmetic; a per-row estimate (or no `itemSize` at all) measures the rendered rows through a `ResizeObserver`, declares the whole column while any height is unknown, and then virtualises at exact heights. Every declared row carries `aria-setsize` / `aria-posinset`, `attach` wires the scrollport without creating a computation (the `createPopover` ref lesson), and `scrollToIndex` is the host's focus hook.
