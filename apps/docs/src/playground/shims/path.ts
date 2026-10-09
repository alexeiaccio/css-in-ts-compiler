// node:path for the engine: `relative`, which names a private token after its file (token.ts). POSIX, as the playground's
// paths are: the working directory is "/" and the file "/playground.tsx".
const parts = (p: string) => p.split("/").filter(Boolean);

export const relative = (from: string, to: string): string => {
  const a = parts(from);
  const b = parts(to);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return [...a.slice(i).map(() => ".."), ...b.slice(i)].join("/");
};
