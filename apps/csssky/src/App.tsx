import { Router } from "./router.tsx";
import { Shell } from "./Shell.tsx";

export default function App() {
  return <Router>{(props) => <Shell>{props.children}</Shell>}</Router>;
}
