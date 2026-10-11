import { reset } from "@cssints/reset" with { type: "cssints" };
import {
  cn,
  color,
  fontSize,
  fontWeight,
  margin,
  maxWidth,
  p,
} from "cssints" with { type: "cssints" };
import { balance, pretty } from "@cssints/balance" with { type: "cssints" };

reset();

// balance() evens the lines of a headline; pretty() keeps a paragraph from ending on one lonely word. Both use text-wrap where
// the browser has it and ship a small runtime where it does not.
const column = cn(maxWidth("30rem"), p(6));
const title = cn(balance(), fontSize("2rem"), fontWeight(800), margin("0"));
const lead = cn(pretty(), color("#475569"), margin("1rem", "0", "0"));

export default function App() {
  return (
    <article className={column}>
      <h1 className={title}>A headline that breaks into lines of a similar length</h1>
      <p className={lead}>
        The paragraph below the headline avoids a last line with a single word, which is what
        pretty() asks the browser for. Resize the preview to see the lines move.
      </p>
    </article>
  );
}
