import { banStatement } from "./ban.ts";

export default banStatement("TryStatement", {
  message:
    "Do not use try/catch. Use Effect.try, Effect.tryPromise, or explicit error channels instead.",
  description: "Avoid try/catch; use Effect.try, Effect.tryPromise, or explicit error channels.",
});
