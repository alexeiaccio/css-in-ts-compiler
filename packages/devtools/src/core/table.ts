// The table the dev server sends (`cssints:devtools`, packages/cssints/src/devtools-server.ts `DevTable`), decoded at the
// boundary, and the model the cascade reads: the table with its sheet parsed and its layers ranked.
import { Data, Effect, Schema } from "effect";

import { parseSheet, type Sheet } from "./css.ts";

const Site = Schema.Struct({
  file: Schema.String,
  line: Schema.Finite,
  column: Schema.Finite,
  classes: Schema.Array(Schema.String),
});

const ClassRecord = Schema.Struct({
  kind: Schema.Literals(["class", "marker", "group"]),
  layer: Schema.String,
  wrap: Schema.Array(Schema.String),
  prop: Schema.String,
  css: Schema.String,
  tokens: Schema.Array(Schema.String),
  plugin: Schema.optionalKey(Schema.String),
  sites: Schema.Array(Schema.Finite),
});

export const Table = Schema.Struct({
  root: Schema.String,
  sheet: Schema.String,
  layers: Schema.Array(Schema.String),
  classes: Schema.Record(Schema.String, ClassRecord),
  sites: Schema.Array(Site),
  tokens: Schema.Record(
    Schema.String,
    Schema.Struct({ path: Schema.String, value: Schema.String }),
  ),
});
export type Table = typeof Table.Type;
export type ClassRecord = typeof ClassRecord.Type;
export type Site = typeof Site.Type;

export class TableError extends Data.TaggedError("TableError")<{ readonly message: string }> {}

export interface Model {
  table: Table;
  sheet: Sheet;
  /** top-level layer -> rank; a rule outside every layer ranks above all of them */
  rank: Map<string, number>;
  /** class -> the indexes of the rules whose selector names it */
  rulesOf: Map<string, number[]>;
}

/** The model of a table as the server sent it: decoded, its sheet parsed. */
export const toModel = Effect.fn("devtools.toModel")(function* (payload: unknown) {
  const table = yield* Schema.decodeUnknownEffect(Table)(payload).pipe(
    Effect.mapError(
      (e) => new TableError({ message: `cssints devtools: a bad table: ${e.message}` }),
    ),
  );
  const sheet = yield* parseSheet(table.sheet);
  const rank = new Map(table.layers.map((l, i) => [l, i]));
  const rulesOf = new Map<string, number[]>();
  for (const r of sheet.rules)
    for (const [, cls] of r.selector.matchAll(/\.(_[\w-]+)/g)) {
      const list = rulesOf.get(cls!) ?? rulesOf.set(cls!, []).get(cls!)!;
      if (list.at(-1) !== r.index) list.push(r.index);
    }
  return { table, sheet, rank, rulesOf } satisfies Model;
});
