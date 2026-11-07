// The sheet's cost by the call that made it: the devtools table maps every class to its rule and to the sites that
// produced it, so the bytes have authors. A class counts once, at its first site (a class can be shared by two calls when
// the declarations are identical); `used` says whether an element carries it now, so a call that costs nothing on this
// page is visible as such.
export interface TableClass {
  css?: string;
  sites?: number[];
}

export interface TableSite {
  file?: string;
  line?: number;
}

export interface TableLike {
  classes?: Record<string, TableClass>;
  sites?: TableSite[];
}

export interface CostRow {
  file: string;
  line: number;
  bytes: number;
  classes: number;
  used: number;
}

export interface Costs {
  /** the heaviest calls, most bytes first */
  rows: CostRow[];
  /** the bytes of every call's classes */
  total: number;
  /** how many calls made the sheet */
  calls: number;
}

export const isTable = (value: unknown): value is TableLike => {
  if (typeof value !== "object" || value === null) return false;
  const table = value as TableLike;
  return typeof table.classes === "object" && table.classes !== null && Array.isArray(table.sites);
};

export const costs = (table: TableLike, carried: ReadonlySet<string>, top = 5): Costs => {
  const rows = new Map<string, CostRow>();
  for (const [name, record] of Object.entries(table.classes ?? {})) {
    const site = record.sites?.length ? table.sites?.[record.sites[0]!] : undefined;
    if (!site || typeof site.file !== "string" || typeof site.line !== "number") continue;
    const key = `${site.file}:${site.line}`;
    const row = rows.get(key) ?? {
      file: site.file,
      line: site.line,
      bytes: 0,
      classes: 0,
      used: 0,
    };
    row.bytes += record.css?.length ?? 0;
    row.classes++;
    if (carried.has(name)) row.used++;
    rows.set(key, row);
  }
  const all = [...rows.values()];
  return {
    rows: all.sort((a, b) => b.bytes - a.bytes).slice(0, top),
    total: all.reduce((sum, row) => sum + row.bytes, 0),
    calls: all.length,
  };
};
