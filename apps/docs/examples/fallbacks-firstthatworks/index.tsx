import {
  bg,
  cn,
  color,
  firstThatWorks,
  flex,
  fontSize,
  minHeight,
  p,
  token,
} from "cssints" with { type: "cssints" };

const brand = token.color("#0057b8", "brand");

// The wanted value comes first, then what to use where it fails: one class, the declarations in CSS order, the wanted one last.
const hero = cn(
  minHeight(firstThatWorks("100dvh", "100vh")),
  flex().direction("column").justifyContent("center").alignItems("center").gap(3),
  bg(firstThatWorks("oklch(55% 0.18 250)", brand)),
  color("white"),
  p(6),
);
const heading = cn(
  fontSize("2rem"),
  color(firstThatWorks("color-mix(in srgb, white, #bae6fd)", "white")),
);

export default function App() {
  return (
    <section className={hero}>
      <h1 className={heading}>Full height, with a fallback</h1>
      <p>min-height: 100vh, then 100dvh where the browser knows it.</p>
    </section>
  );
}
