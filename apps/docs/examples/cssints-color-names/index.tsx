import { reset } from "@cssints/reset" with { type: "cssints" };
import {
  bg,
  borderRadius,
  cn,
  flex,
  fontSize,
  fontWeight,
  minHeight,
  p,
} from "cssints" with { type: "cssints" };
import { named } from "@cssints/color-names" with { type: "cssints" };

reset();

// named() reads a key of the Color Name List at build time and writes its hex: `color(named("tangerine"))` is
// `color:#ff9300`. The names are also split into ten sector members, `colorNames.red("ferrari-red")`, so that completion
// stays short: the biggest sector holds 4,828 names against 31,939 for named(). A name in the wrong sector is a build error
// that says where it is; the colour word in a name decides its sector, else the hue.
const page = cn(flex().wrap("wrap").gap(3), p(2));
const cell = cn(flex().direction("column").gap(1));
const chip = cn(minHeight("3rem"), borderRadius("0.5rem"));
const label = cn(fontSize("0.8125rem"), fontWeight(500));

// every call is a literal, so each name is checked against the list at build time
const swatches = [
  { name: "ferrari-red", cls: cn(chip, bg(named("ferrari-red"))) },
  { name: "tangerine", cls: cn(chip, bg(named("tangerine"))) },
  { name: "gold", cls: cn(chip, bg(named("gold"))) },
  { name: "lime", cls: cn(chip, bg(named("lime"))) },
  { name: "sea-green", cls: cn(chip, bg(named("sea-green"))) },
  { name: "cyan", cls: cn(chip, bg(named("cyan"))) },
  { name: "dodger-blue", cls: cn(chip, bg(named("dodger-blue"))) },
  { name: "hot-pink", cls: cn(chip, bg(named("hot-pink"))) },
  { name: "chocolate", cls: cn(chip, bg(named("chocolate"))) },
  { name: "abalone", cls: cn(chip, bg(named("abalone"))) },
];

export default function App() {
  return (
    <div className={page}>
      {swatches.map(({ name, cls }) => (
        <div className={cell}>
          <div className={cls} />
          <span className={label}>{name}</span>
        </div>
      ))}
    </div>
  );
}
