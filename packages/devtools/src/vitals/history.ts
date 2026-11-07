// The last loads of a page, kept in sessionStorage: one row per navigation, so an edit's effect on the numbers is a delta
// rather than an absolute. Best effort by design: a private window throws on sessionStorage and the report goes on.
export interface Load {
  /** epoch ms */
  at: number;
  path: string;
  fcp: number | null;
  lcp: number | null;
  cls: number;
  ttfb: number | null;
  /** the dev server's last sheet measurement */
  bytes: number | null;
}

export const KEY = "cssints-vitals";
export const LIMIT = 20;

// The part of Storage this needs (a test passes an object with the same three methods).
export interface Vault {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const store = (): Vault | undefined => {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
};

const number = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isLoad = (value: unknown): value is Load => {
  if (typeof value !== "object" || value === null) return false;
  const load = value as Partial<Load>;
  return (
    typeof load.at === "number" &&
    typeof load.path === "string" &&
    typeof load.cls === "number" &&
    number(load.fcp) &&
    number(load.lcp) &&
    number(load.ttfb) &&
    number(load.bytes)
  );
};

// The loads recorded for this origin, oldest first (at most `LIMIT`).
export const history = (vault: Vault | undefined = store()): Load[] => {
  try {
    const raw = vault?.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLoad).slice(-LIMIT) : [];
  } catch {
    return [];
  }
};

// Append one load and return the series (the current one last).
export const record = (load: Load, vault: Vault | undefined = store()): Load[] => {
  const series = [...history(vault), load].slice(-LIMIT);
  try {
    vault?.setItem(KEY, JSON.stringify(series));
  } catch {
    // a full or read-only store is not a reason to lose the report
  }
  return series;
};

export const clear = (vault: Vault | undefined = store()): void => {
  try {
    vault?.removeItem(KEY);
  } catch {
    // as above
  }
};
