/**
 * CSS-in-TS Demo App
 *
 * Demonstrates oxc-macro-based CSS-in-TS with:
 * - CSS property functions (display, p, bg, color, etc.)
 * - cv() for class variants (Button)
 * - cx() for class name merging
 * - Atomic CSS generation at build time
 */

import { cx } from "cssints";
import {
  flex,
  flexBasis,
  flexDirection,
  flexGrow,
  hover,
  media,
  padding,
  fontSize,
  fontWeight,
  color,
  fontFamily,
  bg,
  borderRadius,
  border,
  margin,
  marginTop,
  marginBottom,
  maxWidth,
  boxShadow,
  style,
  token,
  transition,
} from "cssints" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };
import { Button } from "./components/Button.js";
import { Card } from "./components/Card.js";

// Layout styles
const page = [flex().direction("column").gap("1rem")];
const container = [maxWidth("800px"), margin("0 auto")];

// Typography
const h1 = [fontSize("2rem"), fontWeight("700"), marginBottom("0.5rem"), color(t.color.text)];
const h2 = [fontSize("1.25rem"), fontWeight("600"), marginBottom("1rem"), color(t.color.text)];
const subtitle = [color(t.color.muted), marginBottom("2rem"), fontSize("1.125rem")];

// Layout helpers
const row = [flex().gap("0.5rem").wrap("wrap")];
const column = [flex().direction("column").gap("1rem")];

// Info section
const infoSection = [
  marginTop("2rem"),
  padding("1.5rem"),
  bg("#eff6ff"),
  borderRadius("0.5rem"),
  border("1px solid #dbeafe"),
];
const infoH2 = [fontSize("1.25rem"), fontWeight("600"), marginBottom("1rem"), color("#1e40af")];
const infoList = [flex().direction("column").gap("0.5rem"), color("#1e40af")];

// Feature card
const md = media("(width >= 40rem)");
const featureCard = [
  padding("1rem"),
  bg(t.color.surface),
  borderRadius("0.375rem"),
  border("1px solid #e5e7eb"),
  transition("box-shadow 0.2s"),
  hover(boxShadow("0 4px 12px rgba(0, 0, 0, 0.12)")),
  md(flexGrow("1"), flexBasis("0")),
];
const featureTitle = [fontWeight("600"), marginBottom("0.25rem"), color(t.color.text)];
const featureDesc = [fontSize("0.875rem"), color(t.color.muted)];
// One column on a narrow screen, a row of cards from 40rem up.
const featureGrid = [flex().direction("column").gap("1rem"), md(flexDirection("row"))];

// Tokens: one named token, read by a class and set in a style prop.
const accent = token.color("#2563eb", "accent");
const swatch = [
  color(accent),
  fontWeight("600"),
  padding("0.75rem"),
  border("1px solid", accent),
  borderRadius("0.375rem"),
];

function App() {
  return (
    <div
      className={cx(
        ...page,
        padding("2rem"),
        bg(t.color.page),
        fontFamily("system-ui, -apple-system, sans-serif"),
      )}
    >
      <div className={cx(...container)}>
        <h1 className={cx(...h1)}>CSS-in-TS Demo</h1>
        <p className={cx(...subtitle)}>Type-safe CSS with macro-based atomic class generation</p>

        <Card
          title="Button Variants"
          description="Demonstrates cv() macro with multiple variants"
          footer={
            <>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button variant="primary" size="sm">
                Save
              </Button>
            </>
          }
        >
          <div className={cx(...column)}>
            <div className={cx(...row)}>
              <Button variant="primary" size="sm">
                Primary Small
              </Button>
              <Button variant="primary" size="md">
                Primary Medium
              </Button>
              <Button variant="primary" size="lg">
                Primary Large
              </Button>
            </div>
            <div className={cx(...row)}>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div>
              <Button variant="primary" fullWidth>
                Full Width Button
              </Button>
            </div>
          </div>
        </Card>

        <div className={cx(marginTop("1.5rem"))}>
          <Card
            variant="destructive"
            size="sm"
            title="Destructive Card"
            description="This card uses the destructive variant"
          >
            <p>CSS property functions generate atomic CSS at build time.</p>
          </Card>
        </div>

        <div className={cx(...infoSection)}>
          <h2 className={cx(...infoH2)}>How It Works</h2>
          <ul className={cx(...infoList)}>
            <li>
              <strong>1. CSS Functions:</strong> Import property functions like{" "}
              <code>display()</code>, <code>p()</code>, <code>bg()</code>
            </li>
            <li>
              <strong>2. Build-Time Generation:</strong> oxc-macro evaluates functions, generates
              atomic CSS classes
            </li>
            <li>
              <strong>3. Class Merging:</strong> Use <code>cx()</code> to compose multiple class
              names
            </li>
            <li>
              <strong>4. Variants:</strong> Use <code>cv()</code> for component variants with
              multiple props
            </li>
          </ul>
        </div>

        <div className={cx(marginTop("2rem"))}>
          <h2 className={cx(...h2)}>Tokens</h2>
          <div className={cx(...row)}>
            <p data-swatch="default" className={cx(...swatch)}>
              The accent token
            </p>
            <div style={style(token.set(accent, "#dc2626"))}>
              <p data-swatch="set" className={cx(...swatch)}>
                The same class, accent set in a style prop
              </p>
            </div>
          </div>
        </div>

        <div className={cx(marginTop("2rem"))}>
          <h2 className={cx(...h2)}>Key Features</h2>
          <div className={cx(...featureGrid)}>
            {[
              { title: "Zero Runtime", desc: "CSS generated at build time" },
              { title: "Type Safety", desc: "Full TypeScript inference" },
              { title: "Atomic CSS", desc: "Minimal bundle, maximum reuse" },
              { title: "Macro-Based", desc: "oxc-macro evaluates at build time" },
            ].map((feature) => (
              <div key={feature.title} className={cx(...featureCard)}>
                <h3 className={cx(...featureTitle)}>{feature.title}</h3>
                <p className={cx(...featureDesc)}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
