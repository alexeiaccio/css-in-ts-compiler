import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, cn, p } from "cssints" with { type: "cssints" };
import {
  autoGrid,
  cluster,
  sidebar,
  stack,
  switcher,
} from "@cssints/layout" with { type: "cssints" };

reset();

// The layouts of every-layout.dev as members: stack (vertical rhythm), cluster (a wrapping row), sidebar (two columns that stack
// when narrow), switcher (a row that becomes a column under a width) and autoGrid (as many columns as fit).
const page = cn(stack().gap(6), p(4));
const toolbar = cluster().gap(2).justify("space-between");
const split = sidebar().width("12rem").content("60%").gap(4);
const buttons = switcher().threshold("24rem");
const cards = autoGrid().min("9rem").gap(3);
const box = cn(p(3), bg("#e0e7ff"));

export default function App() {
  return (
    <div className={page}>
      <header className={toolbar}>
        <strong>Layouts</strong>
        <nav className={cluster().gap(2)}>
          <a href="#">Docs</a>
          <a href="#">Blog</a>
        </nav>
      </header>
      <section className={split}>
        <aside className={box}>Sidebar</aside>
        <div className={box}>
          Content takes the rest and stacks under the sidebar when it is narrow.
        </div>
      </section>
      <div className={buttons}>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </div>
      <div className={cards}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div className={box}>Card {n}</div>
        ))}
      </div>
    </div>
  );
}
