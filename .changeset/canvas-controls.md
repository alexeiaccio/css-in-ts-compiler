---
"@cssints/headless": patch
---

`createCanvas` leaves the machine idle on a press that began on a control inside a node — a button, a link, a field, a form-control role, editable content, or anything marked `data-canvas-ignore` — so a card that carries its own controls works: the press is the control's, the node is not selected and no drag starts. The same class as a non-primary button, and the rule react-resizable-panels arrived at for its tabs in 4.22.1.
