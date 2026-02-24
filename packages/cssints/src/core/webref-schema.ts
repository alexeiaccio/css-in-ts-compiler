import { Schema } from "effect";

export const WebrefProperty = Schema.Struct({
  name: Schema.String,
});

export const WebrefType = Schema.Struct({
  name: Schema.String,
});

export const WebrefData = Schema.Struct({
  properties: Schema.Array(WebrefProperty),
  types: Schema.Array(WebrefType),
});

export type WebrefProperty = Schema.Schema.Type<typeof WebrefProperty>;
export type WebrefType = Schema.Schema.Type<typeof WebrefType>;
export type WebrefData = Schema.Schema.Type<typeof WebrefData>;
