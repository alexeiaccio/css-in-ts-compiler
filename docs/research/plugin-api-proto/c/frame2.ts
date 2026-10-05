// the frame() of cssints/frame, on the new API (its container-query kernel stays verbatim CSS: see the notes)
import { plugin } from "cssints/plugin";

const p = plugin("fr2");
const tokens = p.tokens({
  radius: { $type: "dimension", $value: "0px" },
  padding: { $type: "dimension", $value: "0px" },
  border: { $type: "dimension", $value: "0px" },
  margin: { $type: "dimension", $value: "0px" },
});
export const frame = p.context(tokens, {
  spacing: ["padding", "margin"],
  kernel: (css) => [
    css.padding(tokens.padding),
    css.margin(tokens.margin),
    css.border(tokens.border, "solid"),
    css.borderRadius(tokens.radius),
  ],
});
