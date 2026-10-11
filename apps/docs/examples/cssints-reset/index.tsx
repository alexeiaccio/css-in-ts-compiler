import { reset } from "@cssints/reset" with { type: "cssints" };
import { cn, color, maxWidth, p } from "cssints" with { type: "cssints" };

// reset({ media?, prose? }) writes a layer below every other style. prose: true gives the elements without a class the rhythm of
// rendered Markdown; media: true makes images and video blocks that do not overflow.
reset({ media: true, prose: true });

const article = cn(maxWidth("34rem"), p(6), color("#1f2937"));

export default function App() {
  return (
    <article className={article}>
      <h1>Reset, with prose</h1>
      <p>
        These elements have no class: the reset gives them a margin of 1em between each other and a
        line height of 1.5.
      </p>
      <ul>
        <li>box-sizing: border-box everywhere</li>
        <li>form controls take the font of the page</li>
      </ul>
      <blockquote>
        Open the CSS tab: the reset is in @layer reset, below every class layer.
      </blockquote>
      <button>A button inherits the font</button>
    </article>
  );
}
