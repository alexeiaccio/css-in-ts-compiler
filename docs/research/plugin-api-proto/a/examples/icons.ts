import { arg, scope } from "cssints/plugin";

interface Collection {
  icons: Record<string, unknown>;
  aliases?: Record<string, unknown>;
}
type IconName<C extends Collection> = (keyof C["icons"] | keyof NonNullable<C["aliases"]>) & string;
type Options = { provider: "iconify-json"; collection: string } | { provider: "fs"; dir: string };
declare const open: (o: Options) => {
  get(name: string): { mask: boolean; url: string } | undefined;
  names(): string[];
  label: string;
};

// one kernel pair for every collection: the scope that owns them registers them once
const shapes = scope("icons", {
  mask: { css: `& { display: inline-block; width: 1em; height: 1em; background-color: currentColor; mask: var(--_svg) no-repeat center / 100% 100% }` },
  image: { css: `& { display: inline-block; width: 1em; height: 1em; background: var(--_svg) no-repeat center / 100% 100% }` },
});

export const icons = <C extends Collection = Collection>(options: Options) => {
  const source = open(options);
  const id = options.provider === "fs" ? options.dir.replace(/\W+/g, "-") : options.collection;
  return scope(`icons-${id}`, { shapes, icon: { args: arg<IconName<C>>() } })
    .build({
      icon: (name) => {
        const icon = source.get(name);
        if (!icon) throw new Error(`no icon ${name} in ${source.label}`);
        return { decls: [["--_svg", icon.url]], uses: [icon.mask ? "shapes.mask" : "shapes.image"] };
      },
    })
    .export().icon;
};
