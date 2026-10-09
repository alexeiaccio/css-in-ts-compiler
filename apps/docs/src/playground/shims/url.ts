// node:url for evaluate.ts: the path of the library's index.ts, which no browser runner looks up.
export const fileURLToPath = (url: string | URL): string => new URL(url).pathname;
