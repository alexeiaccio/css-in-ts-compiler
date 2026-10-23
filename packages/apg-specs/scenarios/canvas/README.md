# Canvas scenarios — upstream tests ported as library-neutral data

Same envelope (and `skipped` shape) as `../apg/README.md`, which is the one
format spec; the step/expectation vocabulary below is canvas-specific and is not
decoded by `src/scenario.ts`. For the canvas machines
(`specs/canvas/camera.qnt`, `specs/canvas/pointer.qnt`). One file per area and
source: `<area>.<source>.json`. Each scenario is a port of one upstream test (no
code copied; behaviour and numbers restated).

Only MIT-licensed sources are ported. **tldraw is deliberately absent**: its
licence is not open-source (see `docs/research/canvas-prior-art.md` §9), so none of
its code, tests or scenario data may be copied or paraphrased.

| source     | repo                  | commit                                     | licence | copyright                     |
| ---------- | --------------------- | ------------------------------------------ | ------- | ----------------------------- |
| excalidraw | excalidraw/excalidraw | `ed10ac7dca7e40f3f4a31269b4bfba980d0db41e` | MIT     | Copyright (c) 2020 Excalidraw |

## NOTICE

The scenario files named `*.excalidraw.json` restate tests from
https://github.com/excalidraw/excalidraw (MIT). The upstream notice travels with
them:

> MIT License
>
> Copyright (c) 2020 Excalidraw
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Shape

The envelope adds `copyright`; `apg` becomes `area` (`"selection"` | `"extension"`,
i.e. not derived from a spec section). `config` always states its own limits
(box-selection mode, drag threshold, camera, nodes) — upstream defaults differ per
library and are never assumed.

- Units: world units for `nodes` and `camera.x / y` (world-offset: screen =
  (world + camera) \* zoom, which is the `camera.qnt` convention), screen px for
  `at`, `viewport` and `dragThresholdPx`.
- `event`: `pointerdown` | `pointermove` | `pointerup` | `pointercancel` |
  `modifier` (`{ "shift": true }`) | `tween` (`goal`, `animation`) | `tick`
  (`count` or `until: "settled"`).
- `expect` checks only what the upstream test checks: `selection` (node ids;
  `selectionOrder: "unordered"`), `selectionChanged` (did THIS step change the
  selection set), `camera`, `tweenActive`, `cameraMoved`,
  `cameraUnchangedSinceSettled`, `panEngaged`.
- The artificial `move(-1000, -1000)` upstream uses to get past a drag threshold is
  dropped: scenarios move straight to the final point.

`test/canvas/scenarios.test.ts` validates the envelope and replays the marquee
scenarios and the centre-on arithmetic against the same definitions the specs use
(contain = box encloses node, overlap = positive-area intersection; fixed-point
centre-on).
