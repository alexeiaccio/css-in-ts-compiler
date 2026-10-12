import * as css from "cssints" with { type: "cssints" };
import { cn, cv, p } from "cssints" with { type: "cssints" };

// module level: the file's name and the variable
export const logo = css.cn(css.display("flex"), css.gap(2));
// an object literal: the property
export const styles = { box: css.cn(css.p(1)), nested: { deep: cn(p(3)) } };
// a helper that returns a cn() with runtime arguments, and a cv()
export const row = (on: boolean, props: { class?: string }) => cn(p(2), on && p(4), props.class);
export const button = cv({
  base: cn(p(2), css.color("red")),
  variants: { size: { sm: p(1), lg: p(4) } },
  defaultVariants: { size: "sm" },
});
// not cn() or cv(): no name
export const svg = css.cx("10px");
export const plain = css.p(5);

export function Landing() {
  const hero = css.cn(css.paddingBlock("2rem"));
  const pick = (on: boolean) => cn(p(2), on && p(3));
  function helper() {
    return cn(p(8));
  }
  return [hero, pick, helper];
}
export const Card = () => {
  const body = cn(p(9));
  return body;
};
export class Panel {
  static head = cn(p(11));
  row() {
    return cn(p(12));
  }
  get wide() {
    return cn(p(13));
  }
}
