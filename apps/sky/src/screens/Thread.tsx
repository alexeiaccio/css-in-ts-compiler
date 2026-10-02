import { Header } from "../Shell.tsx";

export default function Thread(props: { handle: string; rkey: string }) {
  return <Header title={`${props.handle} / ${props.rkey}`} />;
}
