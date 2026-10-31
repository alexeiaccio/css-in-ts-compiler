---
"@cssints/headless": minor
---

`createTabs` takes `dir: "ltr" | "rtl"` (default ltr). A horizontal tablist swaps ArrowLeft / ArrowRight in a right-to-left page, as `radio.ts` does; a vertical tablist keeps Up / Down, and ltr is unchanged. `tabs.qnt` still models ltr only, so the ported `direction` scenarios stay skipped in the differential walk and `test/tabs-requirements.browser.test.tsx` holds the arrow swap.

The same file closes four other requirement gaps in `packages/headless/docs/requirements/tabs.md`: roles and names (G3), focus leaving the component with hidden panels out of the tab order (G6), activation on the up event (G8), and RTL (G11). G5 (icons) is documented as a host obligation; the other seven gaps stay open.
