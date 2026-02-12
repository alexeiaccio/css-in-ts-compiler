import React from "react";

import { button, card, heading, container, input, badge, responsivePadding } from "./styles";

function App() {
	return (
		<div className={container}>
			<h1 className={heading}>CSS-in-TS Compiler Demo</h1>

			<div style={{ marginTop: "2rem" }}>
				<h2>Buttons</h2>
				<div className={responsivePadding}>
					<button className={button}>Primary Button</button>
				</div>
			</div>

			<div style={{ marginTop: "2rem" }}>
				<h2>Card Component</h2>
				<div className={card}>
					<h3>Card Title</h3>
					<p>This is a responsive card component that adapts to different screen sizes.</p>
					<button className={button} style={{ marginTop: "1rem" }}>
						Action
					</button>
				</div>
			</div>

			<div style={{ marginTop: "2rem" }}>
				<h2>Input Component</h2>
				<div className={card}>
					<input className={input} type="text" placeholder="Type something..." />
				</div>
			</div>

			<div style={{ marginTop: "2rem" }}>
				<h2>Badge Component</h2>
				<div className={responsivePadding}>
					<span className={badge}>New</span>
					<span className={badge} style={{ marginLeft: "0.5rem" }}>
						Featured
					</span>
				</div>
			</div>

			<div style={{ marginTop: "2rem" }}>
				<h2>Features</h2>
				<div className={card}>
					<ul>
						<li>✅ Hash-based class names (StyleX pattern)</li>
						<li>✅ Compile-time CSS generation</li>
						<li>✅ Atomic class deduplication</li>
						<li>✅ Design tokens support (W3C standard)</li>
						<li>✅ Responsive utilities</li>
						<li>✅ Pseudo-classes and pseudo-elements</li>
						<li>✅ Media queries</li>
						<li>✅ Type-safe with TypeScript</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

export default App;
