import { banMultiple } from "./ban.ts";

export default banMultiple(
  {
    members: [{ object: "JSON" }, { object: ["globalThis", "JSON"] }],
  },
  {
    message: "Do not use the global JSON API. Use Effect Schema encode/decode APIs instead.",
    description: "Avoid global JSON APIs; encode and decode JSON with Effect Schema.",
  },
);
