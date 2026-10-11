import { bg, cn, flex, p } from "cssints" with { type: "cssints" };

import { button } from "./button.tsx";

// cn() merges at build time what it can; a runtime argument (a prop) stays a choice made when the code runs, and the later
// part replaces the earlier one it overrides: `p(4)` replaces `p(2)` while `roomy` is true.
const toolbar = (props: { roomy?: boolean; quiet?: boolean }) =>
  cn(
    flex().alignItems("center").gap(2),
    p(2),
    props.roomy && p(4),
    props.quiet ? bg("#f1f5f9") : bg("#e0e7ff"),
  );

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(3), p(4))}>
      <div className={toolbar({})}>
        <button className={button()}>Save</button>
        <button className={button({ tone: "danger", size: "lg" })}>Delete</button>
      </div>
      <div className={toolbar({ roomy: true, quiet: true })}>
        <button className={button({ disabled: true })}>Save</button>
        <button className={button({ tone: "danger", disabled: true })}>Delete</button>
      </div>
    </div>
  );
}
