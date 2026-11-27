import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { Effect, Option, Schema } from "effect";
import type { HttpClient } from "effect/http";

import { ToolError } from "./check.ts";

const REPO = resolve(import.meta.dirname, "../../..");
const CHECKOUT = join(REPO, "apps/ui/public/r");
const LIVE = "https://ui.cssints.dev/r";

const File = Schema.Struct({
  path: Schema.String,
  target: Schema.String,
  type: Schema.String,
  content: Schema.optional(Schema.String),
});
const Item = Schema.Struct({
  name: Schema.String,
  title: Schema.String,
  description: Schema.String,
  dependencies: Schema.optional(Schema.Array(Schema.String)),
  devDependencies: Schema.optional(Schema.Array(Schema.String)),
  registryDependencies: Schema.optional(Schema.Array(Schema.String)),
  files: Schema.Array(File),
});
const Registry = Schema.Struct({
  homepage: Schema.optional(Schema.String),
  items: Schema.Array(Item),
});
const Version = Schema.fromJsonString(Schema.Struct({ version: Schema.optional(Schema.String) }));

type Item = typeof Item.Type;

const base = (registry: string | undefined) =>
  (registry ?? (existsSync(join(CHECKOUT, "registry.json")) ? CHECKOUT : LIVE)).replace(/\/+$/, "");

const fileText = (url: string) =>
  Effect.try({
    try: () => readFileSync(url, "utf8"),
    catch: (e) => new ToolError({ message: `cannot read ${url}: ${String(e)}` }),
  });

const httpText = (http: HttpClient.HttpClient, url: string) =>
  http.get(url).pipe(
    Effect.flatMap((response) =>
      response.status < 400 ? response.text.pipe(Effect.asSome) : Effect.succeedNone,
    ),
    Effect.orElseSucceed(() => Option.none()),
  );

const readText = (http: HttpClient.HttpClient, url: string) =>
  Effect.gen(function* () {
    const text = url.startsWith("http")
      ? Option.getOrUndefined(yield* httpText(http, url))
      : yield* fileText(url);
    if (text === undefined) {
      return yield* new ToolError({ message: `cannot read ${url}` });
    }
    return text;
  });

const notARegistry = (url: string) =>
  new ToolError({
    message: `${url} is not a starter registry: an items[], each with a name, a title, a description and files[].target`,
  });

const registryAt = (http: HttpClient.HttpClient, from: string) => {
  const url = `${from}/registry.json`;
  return Effect.flatMap(readText(http, url), (text) =>
    Schema.decodeEffect(Schema.fromJsonString(Registry))(text).pipe(
      Effect.mapError(() => notARegistry(url)),
    ),
  );
};

const itemAt = (http: HttpClient.HttpClient, from: string, name: string) => {
  const url = `${from}/${name}.json`;
  return Effect.flatMap(readText(http, url), (text) =>
    Schema.decodeEffect(Schema.fromJsonString(Item))(text).pipe(
      Effect.mapError(() => notARegistry(url)),
    ),
  );
};

export const listStarters = Effect.fn("mcp.listStarters")(function* (
  http: HttpClient.HttpClient,
  registry: string | undefined,
) {
  const from = base(registry);
  const decoded = yield* registryAt(http, from);
  return {
    source: `${from}/registry.json`,
    homepage: decoded.homepage,
    items: decoded.items.map((item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      dependencies: item.dependencies ?? [],
      registryDependencies: (item.registryDependencies ?? []).map((d) =>
        d.replace(/^@cssints\//, ""),
      ),
      files: item.files.map((f) => f.target),
      test: item.files.find((f) => f.target.endsWith(".browser.test.tsx"))?.target,
    })),
  };
});

interface Planned {
  readonly item: string;
  readonly target: string;
  readonly content: string;
}

const plan = (http: HttpClient.HttpClient, from: string, names: readonly string[]) =>
  Effect.gen(function* () {
    const seen = new Map<string, Item>();
    const queue = [...names];
    for (const name of queue) {
      if (seen.has(name)) continue;
      const item = yield* itemAt(http, from, name);
      seen.set(name, item);
      for (const dependency of item.registryDependencies ?? []) {
        queue.push(dependency.replace(/^@cssints\//, ""));
      }
    }
    const planned: Planned[] = [];
    for (const item of seen.values()) {
      for (const file of item.files) {
        if (file.content === undefined) {
          return yield* new ToolError({
            message: `${from}/${item.name}.json has no content for ${file.target}`,
          });
        }
        const earlier = planned.find((p) => p.target === file.target);
        if (earlier !== undefined && earlier.content !== file.content) {
          return yield* new ToolError({
            message: `${earlier.item} and ${item.name} disagree about ${file.target}`,
          });
        }
        if (earlier === undefined) {
          planned.push({ item: item.name, target: file.target, content: file.content });
        }
      }
    }
    const dependencies = [...new Set([...seen.values()].flatMap((i) => i.dependencies ?? []))];
    const devDependencies = [
      ...new Set([...seen.values()].flatMap((i) => i.devDependencies ?? [])),
    ];
    return { items: [...seen.keys()], planned, dependencies, devDependencies };
  });

const versionOf = (file: string) =>
  existsSync(file)
    ? Effect.sync(() =>
        Schema.decodeOption(Version)(readFileSync(file, "utf8")).pipe(
          Option.flatMap((decoded) => Option.fromUndefinedOr(decoded.version)),
        ),
      )
    : Effect.succeedNone;

export const addStarter = Effect.fn("mcp.addStarter")(function* (
  http: HttpClient.HttpClient,
  names: readonly string[],
  root: string | undefined,
  registry: string | undefined,
  force: boolean | undefined,
) {
  if (names.length === 0) {
    return yield* new ToolError({ message: 'name at least one starter, e.g. ["select"]' });
  }
  const from = base(registry);
  const target = resolve(root ?? process.cwd());
  const { items, planned, dependencies, devDependencies } = yield* plan(http, from, names);
  const at = (path: string) => join(target, path);
  const contents = new Map(planned.map((p) => [p.target, p.content]));
  const differs = (path: string) =>
    existsSync(at(path)) && readFileSync(at(path), "utf8") !== contents.get(path);
  const existing = planned.map((p) => p.target).filter(differs);
  if (existing.length > 0 && force !== true) {
    return yield* new ToolError({
      message: `${existing.join(", ")} already exist in ${target} and differ: pass force: true to replace them`,
    });
  }
  const written = [];
  const unchanged = [];
  for (const p of planned) {
    const path = at(p.target);
    if (existsSync(path) && readFileSync(path, "utf8") === p.content) {
      unchanged.push(p.target);
      continue;
    }
    yield* Effect.try({
      try: () => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, p.content);
      },
      catch: (e) => new ToolError({ message: `cannot write ${path}: ${String(e)}` }),
    });
    written.push(p.target);
  }
  const installed = Option.getOrUndefined(
    yield* versionOf(join(target, "node_modules/cssints/package.json")),
  );
  const checkout =
    from === CHECKOUT
      ? Option.getOrUndefined(yield* versionOf(join(REPO, "packages/cssints/package.json")))
      : undefined;
  const warning =
    checkout !== undefined && installed !== checkout
      ? `written from the checkout (cssints ${checkout}) into a project that has cssints ${installed ?? "not installed"}: install the workspace's packages, not the release, or the copy may use API the release lacks`
      : undefined;
  return {
    root: target,
    registry: from,
    items,
    written,
    unchanged,
    dependencies,
    devDependencies,
    install: dependencies.length > 0 ? `npm install ${dependencies.join(" ")}` : undefined,
    installDev:
      devDependencies.length > 0 ? `npm install -D ${devDependencies.join(" ")}` : undefined,
    tests: [...written, ...unchanged].filter((t) => t.endsWith(".browser.test.tsx")),
    warning,
  };
});
