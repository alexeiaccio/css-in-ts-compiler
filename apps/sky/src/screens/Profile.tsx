import { Header } from "../Shell.tsx";

export default function Profile(props: { handle: string }) {
  return <Header title={props.handle} />;
}
