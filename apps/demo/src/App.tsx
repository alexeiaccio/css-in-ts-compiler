/**
 * CSS-in-TS Demo App
 *
 * Demonstrates the macro-based CSS-in-TS system with:
 * - cv() for class variants (Button)
 * - scv() for slot variants (Card)
 * - Atomic CSS generation at build time
 * - LightningCSS postprocessing
 */

import { Button } from "./components/Button.js";
import { Card } from "./components/Card.js";

function App() {
	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#f3f4f6",
				padding: "2rem",
				fontFamily: "system-ui, -apple-system, sans-serif",
			}}
		>
			<div style={{ maxWidth: "800px", margin: "0 auto" }}>
				<h1
					style={{
						fontSize: "2rem",
						fontWeight: 700,
						marginBottom: "0.5rem",
						color: "#111827",
					}}
				>
					CSS-in-TS Demo
				</h1>
				<p
					style={{
						color: "#6b7280",
						marginBottom: "2rem",
						fontSize: "1.125rem",
					}}
				>
					Type-safe CSS with macro-based atomic class generation
				</p>

				{/* Button Variants Demo */}
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
					<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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

						<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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

				<div style={{ marginTop: "1.5rem" }}>
					<Card
						variant="destructive"
						size="sm"
						title="Destructive Card"
						description="This card uses the destructive variant"
					>
						<p>Slot variants (scv) allow styling multiple elements within a component consistently.</p>
					</Card>
				</div>

				{/* Info Section */}
				<div
					style={{
						marginTop: "2rem",
						padding: "1.5rem",
						backgroundColor: "#eff6ff",
						borderRadius: "0.5rem",
						border: "1px solid #dbeafe",
					}}
				>
					<h2
						style={{
							fontSize: "1.25rem",
							fontWeight: 600,
							marginBottom: "1rem",
							color: "#1e40af",
						}}
					>
						How It Works
					</h2>
					<ul
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.5rem",
							color: "#1e40af",
						}}
					>
						<li>
							<strong>1. Define Variants:</strong> Use <code>cv()</code> and <code>scv()</code> macros to define
							component variants
						</li>
						<li>
							<strong>2. Build-Time Generation:</strong> Macro transforms generate atomic CSS classes
						</li>
						<li>
							<strong>3. Runtime Composition:</strong> Lightweight runtime composes pre-computed class names
						</li>
						<li>
							<strong>4. LightningCSS:</strong> Postprocessing minifies and optimizes output
						</li>
					</ul>
				</div>

				{/* Features */}
				<div style={{ marginTop: "2rem" }}>
					<h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Key Features</h2>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
							gap: "1rem",
						}}
					>
						{[
							{ title: "Zero Runtime", desc: "CSS generated at build time" },
							{ title: "Type Safety", desc: "Full TypeScript inference" },
							{ title: "Atomic CSS", desc: "Minimal bundle, maximum reuse" },
							{ title: "Cascade Layers", desc: "Predictable specificity" },
						].map((feature) => (
							<div
								key={feature.title}
								style={{
									padding: "1rem",
									backgroundColor: "white",
									borderRadius: "0.375rem",
									border: "1px solid #e5e7eb",
								}}
							>
								<h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{feature.title}</h3>
								<p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
