import { reset } from "@cssints/reset" with { type: "cssints" };
import { cn, flex, height, hover, p, width } from "cssints" with { type: "cssints" };
import { skeleton } from "@cssints/skeleton" with { type: "cssints" };

reset();

// skeleton() is a shimmering placeholder; it respects prefers-reduced-motion. The size is yours.
const line = cn(skeleton(), height("1em"), width("12rem"));
const short = cn(skeleton(), height("1em"), width("7rem"));
const avatar = cn(skeleton().radius("50%"), width("3rem"), height("3rem"));
const media = cn(skeleton().color("#e4e4f0").highlight("#f4f4fa"), height("8rem"));
const card = cn(flex().direction("column").gap(3), p(4), hover(skeleton().highlight("white")));

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(4), p(4))}>
      {[0, 1].map(() => (
        <div className={card}>
          <div className={flex().alignItems("center").gap(3)}>
            <div className={avatar} />
            <div className={flex().direction("column").gap(2)}>
              <div className={line} />
              <div className={short} />
            </div>
          </div>
          <div className={media} />
        </div>
      ))}
    </div>
  );
}
