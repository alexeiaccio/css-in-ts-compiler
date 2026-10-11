import {
  bg,
  cn,
  color,
  containerType,
  fontSize,
  margin,
  maxWidth,
  padding,
} from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

// fluid(min, max) is a clamp() between two sizes over the width of the viewport (20rem to 80rem unless told). The build refuses a
// range that fails WCAG 1.4.4, where zooming the text to 200% would not make it larger.
const page = cn(maxWidth("48rem"), margin("0", "auto"), padding(fluid("1rem", "2rem")));
const title = cn(fontSize(fluid("1.75rem", "3.5rem")), margin("0"));
const lead = cn(fontSize(fluid("1rem", "1.375rem")), color("#475569"));
// against the inline size of the nearest container instead of the viewport
const card = cn(padding(fluid.container("1rem", "2rem", { to: "40rem" })), bg("#e0e7ff"));

export default function App() {
  return (
    <main className={page}>
      <h1 className={title}>Type that scales with the window</h1>
      <p className={lead}>
        Resize the preview: the title, this lead and the padding move between their two sizes.
      </p>
      <div className={containerType("inline-size")}>
        <div className={card}>Padding against the width of the container around it</div>
      </div>
    </main>
  );
}
