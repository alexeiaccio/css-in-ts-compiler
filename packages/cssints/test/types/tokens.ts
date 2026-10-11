// What user code sees of tokens: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import * as css from "cssints" with { type: "cssints" };
import {
  animation,
  animationDuration,
  animationName,
  backgroundImage,
  borderImageSource,
  border,
  color,
  counterReset,
  hover,
  imageResolution,
  listStyleImage,
  markerStart,
  media,
  opacity,
  padding,
  rotate,
  token,
  zIndex,
} from "cssints" with { type: "cssints" };

const blue = css.token.color("blue", "color-primary");
const gap = token.length("16px", { var: "gap", inherit: false });
const muted = css.token.color("#6b7280");
const steps = token.number("3", "steps");
const span = token.lengthPercentage("50%", "span");
const turn = token.angle("0.25turn", "turn");
const list = token.transformList("translateX(1px) rotate(1deg)", "moves");
const ident = token.customIdent("slide");
export const all = [blue, gap, muted, steps, span, turn, list, ident];

// A token is a Typed OM value: a typed part of its type, or the one part of a single-part property.
border("1px solid", blue);
color(blue);
color(muted);
padding(gap, gap);
// Tokens compose with conditions and with the other members.
const md = media("(width >= 40rem)");
export const inConditions: string = css.cn(
  color(blue),
  md(color(muted), padding(gap, "1rem")),
  hover(border("1px solid", blue)),
);
// @ts-expect-error a length is not a colour
color(gap);
// @ts-expect-error a colour is not a length
padding(blue);
// @ts-expect-error a border has one colour
border(blue, blue);

// The initial value is checked against the type's grammar.
// @ts-expect-error not a colour
css.token.color("blu");
// @ts-expect-error a length needs its unit
token.length("12", "gap");
// @ts-expect-error not a percentage
token.percentage("50px");
// @ts-expect-error a name is a string or { var, inherit }
token.color("blue", 3);
// @ts-expect-error inherit is a boolean
token.color("blue", { var: "x", inherit: "no" });

// Every token type fits the typed parts of its type, and only those.
const level = token.integer("3", "level");
const dur = token.time("200ms", "dur");
const res = token.resolution("2dppx", "res");
const src = token.url("url(/a.png)", "src");
const img = token.image("linear-gradient(red, blue)", "img");
const pic = token.image("url(/a.png)", "pic");
export const more = [level, dur, res, src, img, pic];

zIndex(level);
opacity(level); // an integer is a number
opacity(steps);
rotate(turn);
rotate("1 0 0", turn);
animationDuration(dur);
animation(dur, ident);
animationName(ident);
counterReset(ident, level);
imageResolution(res);
backgroundImage(src); // a <url> is an <image>
backgroundImage(img);
backgroundImage(pic);
listStyleImage(img);
borderImageSource(src);
markerStart(src);
// @ts-expect-error a number is not an integer
zIndex(steps);
// @ts-expect-error an integer is not a length
padding(level);
// @ts-expect-error a time is not an angle
rotate(dur);
// @ts-expect-error an angle is not a time
animationDuration(turn);
// @ts-expect-error a length is not a name
animationName(gap);
// @ts-expect-error a colour is not a name
animationName(blue);
// @ts-expect-error a name is not a length
padding(ident);
// @ts-expect-error a name is not a colour
color(ident);
// @ts-expect-error a time is not a name
animationName(dur);
// @ts-expect-error a resolution is not an angle
rotate(res);
// @ts-expect-error an angle is not a resolution
imageResolution(turn);
// @ts-expect-error a url is not a colour
color(src);
// @ts-expect-error an image is not a colour
color(img);
// @ts-expect-error an image is not a <url>
markerStart(img);
// @ts-expect-error a colour is not an image
backgroundImage(blue);
// @ts-expect-error an integer is not an image
backgroundImage(level);
// @ts-expect-error a name is not an image
backgroundImage(ident);
// @ts-expect-error a length is not a time
animationDuration(gap);
// @ts-expect-error a url needs url()
token.url("a.png");
// a shadow token is a list of box shadows, an easing function any of them
token.shadow("0 1px 2px red, inset 0 0 0 1px blue", "elevation");
token.easingFunction("linear(0, 0.5 20%, 1)", "spring");
// @ts-expect-error a shadow needs two lengths
token.shadow("red");
// @ts-expect-error not an easing function
token.easingFunction("fast");
// @ts-expect-error an image is not a colour
token.image("red");
// @ts-expect-error a resolution needs its unit
token.resolution("2");
// @ts-expect-error not an integer
token.integer("1.5");
// @ts-expect-error a time needs its unit
token.time("200");

// token.set() takes a token with a name and a value of its type; style() takes styles and set() results.
export const themed: Record<string, string> = css.style(
  css.color(blue),
  css.token.set(blue, "red"),
  token.set(gap, "2rem"),
  token.set(steps, "4"),
);
// @ts-expect-error a private token cannot be set
css.token.set(muted, "red");
// @ts-expect-error not a colour
css.token.set(blue, "1rem");
// @ts-expect-error not a length
token.set(gap, "red");
// @ts-expect-error style takes styles, not numbers
css.style(1);
