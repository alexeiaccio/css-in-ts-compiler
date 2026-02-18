// Test the new cssints API with compiler
// Pattern: import * as css from "cssints" with { type: "cssints" }
import * as css from "cssints" with { type: "cssints" };

// Test basic spacing
const padding = css.p(4);

// Test flex utilities - flexCenter is a shortcut for display:flex + align-items:center + justify-content:center
const flexCenter = css.flexCenter();

// Test column with gap
const column = css.col(2);

// Test responsive with media query
const mdPadding = css.md(css.p(6));

// Test hover state
const hoverStyles = css.hover(css.bg("#2563eb"));

// Test more utilities from API.md pattern
const flexRow = css.flex();  // display: flex
const centeredItems = css.items("center");  // align-items: center
const spacedBetween = css.justify("between");  // justify-content: space-between

export default function App() {
	return (
		<div className={flexCenter}>
			<h1>css-in-ts compiler</h1>
			
			<div className={column}>
				<p className={padding}>Basic padding test</p>
				
				<div className={mdPadding}>
					<p>Responsive padding (md breakpoint)</p>
				</div>
				
				<button className={hoverStyles}>
					Hover me (check CSS)
				</button>
				
				<div className={`${flexRow} ${centeredItems} ${spacedBetween}`}>
					<span>Left</span>
					<span>Right</span>
				</div>
			</div>
		</div>
	);
}
