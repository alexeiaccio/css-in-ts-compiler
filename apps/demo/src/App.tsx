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
	flex, grid, padding, fontSize, fontWeight,
	color, fontFamily, bg, borderRadius, border, margin, marginTop,
	marginBottom, maxWidth,
} from "cssints" with { type: "cssints" };
import { Button } from "./components/Button.js";
import { Card } from "./components/Card.js";

// Layout styles
const page = [flex().direction("column").gap("1rem")];
const container = [maxWidth("800px"), margin("0 auto")];

// Typography
const h1 = [fontSize("2rem"), fontWeight("700"), marginBottom("0.5rem"), color("#111827")];
const h2 = [fontSize("1.25rem"), fontWeight("600"), marginBottom("1rem")];
const subtitle = [color("#6b7280"), marginBottom("2rem"), fontSize("1.125rem")];

// Layout helpers
const row = [flex().gap("0.5rem").wrap("wrap")];
const column = [flex().direction("column").gap("1rem")];

// Info section
const infoSection = [
	marginTop("2rem"), padding("1.5rem"), bg("#eff6ff"),
	borderRadius("0.5rem"), border("1px solid #dbeafe"),
];
const infoH2 = [fontSize("1.25rem"), fontWeight("600"), marginBottom("1rem"), color("#1e40af")];
const infoList = [flex().direction("column").gap("0.5rem"), color("#1e40af")];

// Feature card
const featureCard = [
	padding("1rem"), bg("white"), borderRadius("0.375rem"), border("1px solid #e5e7eb"),
];
const featureTitle = [fontWeight("600"), marginBottom("0.25rem")];
const featureDesc = [fontSize("0.875rem"), color("#6b7280")];
const featureGrid = [grid().gap("1rem")];

function App() {
	return (
		<div className={cx(...page, padding("2rem"), bg("#f3f4f6"), fontFamily("system-ui, -apple-system, sans-serif"))}>
			<div className={cx(...container)}>
				<h1 className={cx(...h1)}>CSS-in-TS Demo</h1>
				<p className={cx(...subtitle)}>Type-safe CSS with macro-based atomic class generation</p>

				<Card
					title="Button Variants"
					description="Demonstrates cv() macro with multiple variants"
					footer={
						<>
							<Button variant="outline" size="sm">Cancel</Button>
							<Button variant="primary" size="sm">Save</Button>
						</>
					}
				>
					<div className={cx(...column)}>
						<div className={cx(...row)}>
							<Button variant="primary" size="sm">Primary Small</Button>
							<Button variant="primary" size="md">Primary Medium</Button>
							<Button variant="primary" size="lg">Primary Large</Button>
						</div>
						<div className={cx(...row)}>
							<Button variant="secondary">Secondary</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="ghost">Ghost</Button>
						</div>
						<div>
							<Button variant="primary" fullWidth>Full Width Button</Button>
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
						<li><strong>1. CSS Functions:</strong> Import property functions like <code>display()</code>, <code>p()</code>, <code>bg()</code></li>
						<li><strong>2. Build-Time Generation:</strong> oxc-macro evaluates functions, generates atomic CSS classes</li>
						<li><strong>3. Class Merging:</strong> Use <code>cx()</code> to compose multiple class names</li>
						<li><strong>4. Variants:</strong> Use <code>cv()</code> for component variants with multiple props</li>
					</ul>
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
