import {
  bg,
  cn,
  color,
  display,
  flex,
  fontSize,
  fontWeight,
  lineClamp,
  overflow,
  p,
  WebkitBoxOrient,
  WebkitLineClamp,
} from "cssints" with { type: "cssints" };

// Teasers of three lines. The WebKit box is the way that works in every engine today and is quiet; the standard lineClamp()
// is a member too, and the build warns for the targets that lack it: the warning appears under the editor, with its place.
const clamp3 = cn(
  display("-webkit-box"),
  WebkitBoxOrient("vertical"),
  WebkitLineClamp(3),
  overflow("hidden"),
);
const standard = cn(lineClamp(3), overflow("hidden"));

const teaser = cn(p(4), bg("#f8fafc"), color("#0f172a"), fontSize("0.9375rem"));
const heading = cn(fontWeight(700), fontSize("1.125rem"));
const text =
  "A bad value is an error in the editor and again in the build, with the file and the place of the call. A value that a browser in your browserslist lacks is a warning, not an error, and it is said once per file.";

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(3), p(4), color("#0f172a"))}>
      <article className={teaser}>
        <h2 className={heading}>WebKit box</h2>
        <p className={clamp3}>{text}</p>
      </article>
      <article className={teaser}>
        <h2 className={heading}>Standard line-clamp</h2>
        <p className={standard}>{text}</p>
      </article>
    </div>
  );
}
