import "virtual:cssints.css";
import { cn, color, p } from "cssints" with { type: "cssints" };

function Landing() {
  const logo = cn(color("rebeccapurple"), p(2));
  document.getElementById("p")?.setAttribute("class", logo);
}
Landing();
