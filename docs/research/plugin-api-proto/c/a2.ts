import { plugin } from "cssints/plugin";
const p = plugin("x");
export const tokens = p.tokens({
  radius: { $type: "dimension", $value: "0px" },
  padding: { $type: "dimension", $value: "0px" },
  border: { $type: "dimension", $value: "0px" },
  margin: { $type: "dimension", $value: "0px" },
});
