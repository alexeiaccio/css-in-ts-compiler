import { reset } from "@cssints/reset" with { type: "cssints" };
import {
  bg,
  borderBottom,
  cn,
  color,
  flex,
  fontWeight,
  hover,
  p,
} from "cssints" with { type: "cssints" };
import { sticky, stuck } from "@cssints/stuck" with { type: "cssints" };

reset();

// sticky() is position: sticky; stuck(...) styles the same element's descendants while it is stuck, with no scroll listener.
const header = cn(sticky().top("0"), bg("white"), p(3), borderBottom("1px solid transparent"));
const title = cn(color("#6b7280"), fontWeight(600), stuck(color("#dc2626")));
const link = stuck("top")(color("#16a34a"), hover(color("black")));

export default function App() {
  return (
    <div>
      <header className={header}>
        <h1 className={title}>Scroll: I turn red while the header is stuck</h1>
      </header>
      <main className={cn(flex().direction("column").gap(4), p(4))}>
        {Array.from({ length: 16 }, (_, n) => (
          <p>
            Paragraph {n + 1}.{" "}
            <a href="#" className={link}>
              link
            </a>
          </p>
        ))}
      </main>
    </div>
  );
}
