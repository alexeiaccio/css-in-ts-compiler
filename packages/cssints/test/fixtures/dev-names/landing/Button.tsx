import { cn, p } from "cssints" with { type: "cssints" };

declare function h(tag: unknown, props: unknown): unknown;
declare function Tone(props: { tone: string }): unknown;

export const Button = (props: { on: boolean }) => (
  <div class={cn(p(1))}>
    <span className={cn(p(2), props.on && p(3))} />
    <Tone tone={cn(p(4))} />
  </div>
);
