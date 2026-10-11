import { reset } from "@cssints/reset" with { type: "cssints" };
import { alignItems, cn, display, justifyContent, p } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

reset();

// Two spellings of one thing: a property per call, or a layout context. A runtime argument (a prop) stays a choice made in the
// browser; every call inside it is still a class made at build time. See the Module tab for what ships.
export const A = (props: { roomy?: boolean }) => (
  <div
    className={cn(
      display("flex"),
      alignItems("center"),
      justifyContent("center"),
      css.minHeight("5rem"),
      css.bg("#eef2ff"),
      css.color("#0f172a"),
      props.roomy && p(8),
    )}
  >
    Hello, world!
  </div>
);

export const B = (props: { roomy?: boolean }) => (
  <div
    className={cn(
      css.flex().alignItems("center").justifyContent("center"),
      css.minHeight("5rem"),
      css.bg("#ecfdf5"),
      css.color("#0f172a"),
      props.roomy && css.p(8),
    )}
  >
    Hello, world!
  </div>
);

export default function App() {
  return (
    <div className={css.flex().direction("column").gap(3)}>
      <A />
      <A roomy />
      <B roomy />
    </div>
  );
}
