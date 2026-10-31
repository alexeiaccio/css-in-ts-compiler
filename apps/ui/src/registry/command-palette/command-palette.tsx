import {
  type CommandPaletteLabels,
  type CommandPalette as Palette,
  type PaletteCommand,
  type PaletteResult,
  createCommandPalette,
} from "@cssints/headless";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import {
  createContext,
  createEffect,
  createUniqueId,
  For,
  merge,
  omit,
  onSettled,
  Show,
  untrack,
  useContext,
} from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface CommandPaletteProps {
  /** The commands, declared once: the primitive filters them and the skin renders its results. */
  readonly commands: ReadonlyArray<PaletteCommand>;
  /** Every visible string; `title` names the dialog and the listbox, `placeholder` the field. */
  readonly labels?: Partial<CommandPaletteLabels>;
  /** The open state changed. The primitive owns it; this is the notification, not a control. */
  readonly onOpenChange?: (open: boolean) => void;
  /**
   * The chord the palette binds on the page (`"mod+k"`), or `false` to bind none. A host that wants it
   * scoped to its own element binds `createHotkeys` itself and calls `openPalette` from `onReady`.
   */
  readonly hotkey?: string | false;
  /** The element the layer is portalled into (default `document.body`). */
  readonly mount?: Element;
  /** The primitive, once: a host that binds its own chord opens the palette through it. */
  readonly onReady?: (palette: Palette) => void;
  readonly children?: JSX.Element;
}

export interface CommandPaletteContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface CommandPaletteTriggerProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface CommandPaletteInputProps extends Renderable<PartProps, void> {
  readonly class?: string;
  /** The field's name; without one the dialog's title names it. */
  readonly label?: string;
}

export interface CommandPaletteListProps extends Renderable<PartProps, void> {
  readonly class?: string;
}

/** What a row's `render` sees: whether the primitive names it as the active option. */
export interface CommandPaletteItemState {
  readonly highlighted: () => boolean;
}

export interface CommandPaletteItemProps extends Renderable<PartProps, CommandPaletteItemState> {
  /** The command's id: the primitive owns the option's id, its role and its announcement. */
  readonly id: string;
  readonly class?: string;
  /** The row's content; the command's label by default. */
  readonly children?: JSX.Element;
}

export interface CommandPaletteEmptyProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

const CommandPaletteContext = createContext<{
  readonly palette: Palette;
  readonly titleId: string;
  readonly mount: () => Element | undefined;
}>();

// The layer holds the page still and takes the wash; the panel floats above both, is a surface and a frame like a card, and
// sits high on the page rather than in its middle, which is what a palette is for: the reader is looking at the results, not
// at a box they centred on purpose.
const layerClass = css.cn(
  css.position("fixed"),
  css.inset("0"),
  // `z-index` takes an `<integer>`, which a `number` token is not: the custom property is the knob
  css.zIndex("var(--z-dialog)"),
  css.display("grid"),
  css.justifyItems("center"),
  css.alignItems("start"),
  css.padding(t.space._4),
  css.paddingBlockStart("12vh"),
  css.overflow("auto"),
);

const backdropClass = css.cn(css.position("absolute"), css.inset("0"), css.bg(t.color.scrim));

const panelClass = css.cn(
  frame().radius(t.radius.xl).padding(0).border("1px"),
  surface().color(t.color.overlayBackground),
  css.borderColor(t.color.overlayBorder),
  css.color(t.color.text),
  css.boxShadow(t.shadow.popover),
  css.position("relative"),
  css.display("flex"),
  css.flexDirection("column"),
  css.width("min(32rem, 100%)"),
  css.maxHeight("calc(100dvh - 12vh - 2 * 16px)"),
  // the field stays at the top and the results scroll under it
  css.overflow("hidden"),
  css.outline("none"),
);

const inputClass = css.cn(
  css.boxSizing("border-box"),
  css.width("100%"),
  css.padding(t.space._3, t.space._4),
  css.border("none"),
  css.borderBlockEnd("1px solid", t.color.border),
  css.bg("transparent"),
  css.color(t.color.fieldText),
  css.fontSize(t.font.sizeLg),
  // the field is the only control in the panel: it takes the focus on open and the caret is the indicator
  css.outline("none"),
);

const listClass = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap("2px"),
  css.padding(t.space._1),
  // the panel's max height bounds the list, and this is what lets it shrink to that bound and scroll
  css.minHeight("0"),
  css.overflowY("auto"),
);

const groupClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap("2px"));

const groupLabelClass = css.cn(
  css.padding(t.space._1, t.space._2),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("600"),
  css.color(t.color.muted),
);

// The APG combobox highlight: focus stays in the field and the primitive marks the active option with `aria-selected`, so
// the row paints the announcement and the kit keeps no copy of the active index. A pointer hover is the same attribute.
const itemClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.attr("aria-selected", "true")(css.bg(t.color.buttonBackground)),
);

const emptyClass = css.cn(
  css.padding(t.space._3, t.space._2),
  css.fontSize(t.font.size),
  css.color(t.color.muted),
  css.textAlign("center"),
);

// Nothing to show, still nothing to see: the dialog's name and the live region are read, not looked at.
const silentClass = css.cn(
  css.position("absolute"),
  css.width("1px"),
  css.height("1px"),
  css.overflow("hidden"),
  css.clipPath("inset(50%)"),
  css.whiteSpace("nowrap"),
);

/**
 * APG command palette, styled: `CommandPaletteTrigger` opens it, `CommandPaletteContent` is the modal layer, and
 * `CommandPaletteInput`, `CommandPaletteList`, `CommandPaletteItem` and `CommandPaletteEmpty` are the query and the results.
 * `createCommandPalette` owns the dialog, the query, the filter (`results()` is what the skin renders, in the host's order),
 * the active option (`aria-activedescendant`), the arrows, Home and End, Enter, Escape, the focus into the field and back,
 * and the hotkey. The skin adds the scrim, the surface, the field, the grouped rows and the highlight.
 *
 * A palette is a dialog with a search field, not a combobox: the primitive announces the field as a `searchbox` because
 * choosing a row runs a command, it does not complete the field.
 */
export const CommandPalette = (props: CommandPaletteProps): JSX.Element => {
  const palette = createCommandPalette({
    commands: props.commands,
    get hotkey() {
      return typeof props.hotkey === "string" ? props.hotkey : undefined;
    },
    labels: props.labels,
    get onOpenChange() {
      return props.onOpenChange;
    },
  });
  // the page's chord, as the primitive's `attach` means it: `false` is the host saying it binds its own
  onSettled(() => (props.hotkey === false ? undefined : palette.attach()));
  // structural, read once: it is the primitive for a host that opens the palette itself
  untrack(() => props.onReady)?.(palette);

  return (
    <CommandPaletteContext
      value={{ palette, titleId: palette.titleProps.id, mount: () => props.mount }}
    >
      {props.children}
      {/* always mounted: a live region has to exist before its text changes */}
      <div {...palette.statusProps} data-part="command-palette-status" class={silentClass}>
        {palette.status()}
      </div>
    </CommandPaletteContext>
  );
};

/**
 * The layer, the wash and the panel. Nothing is in the DOM while the palette is closed; the field takes the focus when it
 * opens and the primitive returns it to whatever had it when it closes, and the page does not scroll under the scrim.
 *
 * The layer is portalled into `document.body` (or `mount`) so an ancestor's `transform`, `filter`, `contain` or `overflow`
 * can neither clip it nor become the containing block of its `position: fixed`.
 */
export const CommandPaletteContent = (props: CommandPaletteContentProps): JSX.Element => {
  const { palette, mount } = useContext(CommandPaletteContext);
  let scroll: string | undefined;
  createEffect(
    () => palette.open(),
    (open) => {
      if (open) {
        scroll = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      } else if (scroll !== undefined) {
        document.body.style.overflow = scroll;
        scroll = undefined;
      }
    },
  );
  return (
    <Show when={palette.open()}>
      <Portal mount={mount()}>
        <div data-part="command-palette-layer" class={layerClass}>
          <div
            {...palette.backdropProps}
            data-part="command-palette-backdrop"
            class={backdropClass}
          />
          {renderPart(
            props,
            merge(omit(props, "render", "class", "children"), palette.dialogProps, () => ({
              "data-part": "command-palette",
              get class() {
                return css.cn(panelClass, props.class);
              },
            })),
            undefined,
            (part) => (
              <div {...part}>
                {/* the name the dialog and the listbox are labelled by: one id, rendered once */}
                <h2 {...palette.titleProps} data-part="command-palette-title" class={silentClass}>
                  {palette.labels.title}
                </h2>
                {props.children ?? (
                  <>
                    <CommandPaletteInput />
                    <CommandPaletteList />
                    <CommandPaletteEmpty />
                  </>
                )}
              </div>
            ),
          )}
        </div>
      </Portal>
    </Show>
  );
};

/** The button that opens the palette: `Button` unless `render` says otherwise. It is the element with `aria-haspopup`. */
export const CommandPaletteTrigger = (props: CommandPaletteTriggerProps): JSX.Element => {
  const { palette } = useContext(CommandPaletteContext);
  const rest = omit(props, "render", "class", "children");
  // `merge` reads these through, so a plain spread would freeze `aria-expanded`
  const merged = merge(rest, () => ({
    "aria-haspopup": "dialog" as const,
    get "aria-expanded"() {
      return palette.open() ? "true" : "false";
    },
    get "aria-controls"() {
      return palette.dialogProps.id;
    },
    onClick: () => palette.openPalette(),
    get class() {
      return css.cn(props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/**
 * The query field. The primitive owns its value, its `role="searchbox"`, its `aria-controls`, the active option's id and
 * the key handler; the skin names it by the dialog's title and gives it the panel's look.
 */
export const CommandPaletteInput = (props: CommandPaletteInputProps): JSX.Element => {
  const { palette, titleId } = useContext(CommandPaletteContext);
  const input = palette.inputProps;
  const merged = merge(omit(props, "render", "class", "label"), () => ({
    id: input.id,
    type: input.type,
    role: input.role,
    placeholder: input.placeholder,
    autoComplete: input.autoComplete,
    spellcheck: input.spellcheck,
    "aria-label": props.label,
    get "aria-labelledby"() {
      return props.label === undefined ? titleId : undefined;
    },
    get "aria-controls"() {
      return input["aria-controls"];
    },
    get "aria-activedescendant"() {
      return input["aria-activedescendant"];
    },
    get value() {
      return input.value;
    },
    onInput: input.onInput,
    onKeyDown: input.onKeyDown,
    "data-part": "command-palette-input",
    get class() {
      return css.cn(inputClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => <input {...part} />);
};

/**
 * The results: the primitive's `results()` in the host's order, one `role="group"` per `group` with its heading, and a row
 * per command. The skin filters nothing: what is not in `results()` is not rendered, so the empty state is the only thing
 * left when the query matches nothing.
 */
export const CommandPaletteList = (props: CommandPaletteListProps): JSX.Element => {
  const { palette } = useContext(CommandPaletteContext);
  // Group names and ids are strings, so `For` keeps a row (and its DOM) across a query that still matches it.
  const groups = (): ReadonlyArray<string | undefined> => {
    const names: Array<string | undefined> = [];
    for (const result of palette.results()) {
      if (!names.includes(result.group)) {
        names.push(result.group);
      }
    }
    return names;
  };
  const rows = (group: string | undefined): ReadonlyArray<string> =>
    palette
      .results()
      .filter((result) => result.group === group)
      .map((result) => result.id);

  const merged = merge(palette.listProps, () => ({
    "data-part": "command-palette-list",
    get class() {
      return css.cn(listClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      <For each={groups()}>
        {(group) => {
          const labelId = createUniqueId();
          return (
            <div
              role="group"
              data-part="command-palette-group"
              aria-labelledby={group === undefined ? undefined : labelId}
              class={groupClass}
            >
              <div
                id={group === undefined ? undefined : labelId}
                hidden={group === undefined}
                data-part="command-palette-group-label"
                class={groupLabelClass}
              >
                {group}
              </div>
              <For each={rows(group)}>{(id) => <CommandPaletteItem id={id} />}</For>
            </div>
          );
        }}
      </For>
    </div>
  ));
};

/**
 * One result: `role="option"`, its id, `tabindex="-1"` and `aria-selected` from the primitive, the command's label unless
 * `children` says. A press keeps the focus in the field (the primitive cancels the mouse-down) and runs the command.
 */
export const CommandPaletteItem = (props: CommandPaletteItemProps): JSX.Element => {
  const { palette } = useContext(CommandPaletteContext);
  const result = (): PaletteResult | undefined =>
    palette.results().find((candidate) => candidate.id === props.id);
  const merged = merge(
    () => palette.optionProps(props.id),
    () => ({
      "data-part": "command-palette-item",
      get class() {
        return css.cn(itemClass, props.class);
      },
    }),
  );
  const state: CommandPaletteItemState = {
    highlighted: () => palette.optionProps(props.id)["aria-selected"] === "true",
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>{props.children ?? result()?.label}</div>
  ));
};

/** The empty state: the primitive hides it while a result exists. */
export const CommandPaletteEmpty = (props: CommandPaletteEmptyProps): JSX.Element => {
  const { palette } = useContext(CommandPaletteContext);
  const merged = merge(palette.emptyProps, () => ({
    "data-part": "command-palette-empty",
    get class() {
      return css.cn(emptyClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? palette.labels.empty}</div>
  ));
};
