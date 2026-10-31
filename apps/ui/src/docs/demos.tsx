// One live example per starter. Each is the component in its ordinary use, driven by a signal the
// way a page would drive it: what a reader copies is what they see here.
import { Accordion } from "../registry/accordion/accordion.tsx";
import { Alert, AlertBody, AlertTitle } from "../registry/alert/alert.tsx";
import { Dropzone, DropzoneBrowse } from "../registry/dropzone/dropzone.tsx";
import { Badge } from "../registry/badge/badge.tsx";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "../registry/breadcrumb/breadcrumb.tsx";
import { Card, CardBody, CardFooter, CardHeader } from "../registry/card/card.tsx";
import { Button } from "../registry/button/button.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../registry/dialog/dialog.tsx";
import { ButtonGroup } from "../registry/button-group/button-group.tsx";
import { Field, FieldControl, FieldLabel, FieldMessage } from "../registry/field/field.tsx";
import { Input } from "../registry/input/input.tsx";
import { Meter } from "../registry/meter/meter.tsx";
import { Separator } from "../registry/separator/separator.tsx";
import { Select, SelectContent, SelectTrigger } from "../registry/select/select.tsx";
import { Skeleton } from "../registry/skeleton/skeleton.tsx";
import { Textarea } from "../registry/textarea/textarea.tsx";
import { Menu, MenuContent, MenuTrigger } from "../registry/menu/menu.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../registry/popover/popover.tsx";
import {
  DatePicker,
  DatePickerContent,
  DatePickerTrigger,
} from "../registry/date-picker/date-picker.tsx";
import { Menubar } from "../registry/menubar/menubar.tsx";
import { Toolbar } from "../registry/toolbar/toolbar.tsx";
import { Treeview } from "../registry/treeview/treeview.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "../registry/tooltip/tooltip.tsx";
import { Checkbox } from "../registry/checkbox/checkbox.tsx";
import { CheckboxGroup } from "../registry/checkbox-group/checkbox-group.tsx";
import { Disclosure } from "../registry/disclosure/disclosure.tsx";
import { RadioGroup } from "../registry/radio/radio.tsx";
import { Slider } from "../registry/slider/slider.tsx";
import { SliderMultithumb } from "../registry/slider-multithumb/slider-multithumb.tsx";
import { Spinbutton } from "../registry/spinbutton/spinbutton.tsx";
import { Switch } from "../registry/switch/switch.tsx";
import { createToast } from "@cssints/headless";
import { Tabs } from "../registry/tabs/tabs.tsx";
import { Toaster } from "../registry/toast/toast.tsx";
import { createSignal, For } from "solid-js";
import type { JSX } from "@solidjs/web";

const SwitchDemo = (): JSX.Element => {
  const [checked, setChecked] = createSignal(true);
  return (
    <Switch value={checked()} onValueChange={setChecked}>
      {checked() ? "On" : "Off"}
    </Switch>
  );
};

const DisclosureDemo = (): JSX.Element => (
  <Disclosure summary="Shipping, returns and refunds">
    A disclosure is one button and the panel it shows. The chevron turns with `aria-expanded`.
  </Disclosure>
);

const ButtonDemo = (): JSX.Element => {
  const [pressed, setPressed] = createSignal(true);
  return (
    <div class="demo-column">
      <div class="demo-row">
        <Button onClick={() => undefined}>Save</Button>
        <Button tone="accent">Publish</Button>
        <Button tone="quiet">Cancel</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div class="demo-row">
        <Button size="sm">Small</Button>
        <Button isToggle value={pressed()} onValueChange={setPressed}>
          {pressed() ? "Pinned" : "Pin"}
        </Button>
        {/* render replaces the element: a link that acts as a button keeps the button's props */}
        <Button tone="quiet" render={(props) => <a {...props} href="#a-link" />}>
          A link
        </Button>
      </div>
    </div>
  );
};

const CardDemo = (): JSX.Element => (
  <div class="demo-column">
    <Card>
      <CardHeader>
        <strong>Monthly report</strong>
        <Button size="sm" tone="quiet">
          Open
        </Button>
      </CardHeader>
      <CardBody>
        A card is a surface one step off the page and a frame that hands its inner radius down: put
        a card in a card and the inner corners stay concentric.
      </CardBody>
      <CardFooter>
        <Button size="sm" tone="quiet">
          Share
        </Button>
        <Button size="sm" tone="accent">
          Download
        </Button>
      </CardFooter>
    </Card>
    <div data-mode="dark">
      <Card>
        <CardBody>
          The same card in <code>data-mode="dark"</code>: the mode is the context, not a prop.
        </CardBody>
      </Card>
    </div>
  </div>
);

const ToolbarDemo = (): JSX.Element => (
  <div class="demo-column">
    <Toolbar label="Default">
      <Button>Undo</Button>
      <Button tone="quiet">Redo</Button>
      <Button tone="quiet">Share</Button>
    </Toolbar>
    {/* size="sm" is the context: the buttons inside are compact without a prop of their own */}
    <Toolbar label="Compact" size="sm">
      <Button>Undo</Button>
      <Button tone="quiet">Redo</Button>
      <Button tone="quiet">Share</Button>
    </Toolbar>
  </div>
);

const ButtonGroupDemo = (): JSX.Element => (
  <div class="demo-column">
    <ButtonGroup label="Text alignment">
      <Button tone="quiet">Left</Button>
      <Button tone="quiet">Center</Button>
      <Button tone="quiet">Right</Button>
    </ButtonGroup>
    {/* a vertical group squares the top and the bottom instead, and size="sm" is the context as in a toolbar */}
    <ButtonGroup label="Stacked" orientation="vertical" size="sm">
      <Button>Up</Button>
      <Button>Down</Button>
    </ButtonGroup>
  </div>
);

const DialogDemo = (): JSX.Element => {
  const [open, setOpen] = createSignal(false);
  return (
    <Dialog
      label="Rename file"
      description="The new name shows up in the list and in every link to it."
      open={open()}
      onOpenChange={setOpen}
    >
      <DialogTrigger>Rename</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename</DialogTitle>
        <Input value="Report Q3" />
        <div class="demo-row">
          <DialogClose>Cancel</DialogClose>
          <Button tone="accent" onClick={() => setOpen(false)}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// The menu owns its open state (the primitive is uncontrolled), so the demo needs no signal: the trigger opens it, an item
// or Escape closes it, and a pointer outside the anchor is the third way out.
const MenuDemo = (): JSX.Element => (
  <div class="demo-column">
    <Menu items={["Rename", "Duplicate", { label: "Delete", disabled: true }]}>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuContent />
    </Menu>
    <Menu items={["Cut", "Copy", "Paste"]}>
      <MenuTrigger>Edit</MenuTrigger>
      <MenuContent />
    </Menu>
  </div>
);

const MenubarDemo = (): JSX.Element => (
  <Menubar
    items={[
      {
        label: "File",
        menu: [
          { label: "New" },
          { label: "Export", submenu: [{ label: "PDF" }, { label: "PNG" }] },
          { label: "Close" },
        ],
      },
      { label: "Edit", menu: [{ label: "Undo" }, { label: "Redo" }] },
      { label: "Help" },
    ]}
  />
);

const TooltipDemo = (): JSX.Element => (
  <div class="demo-row">
    <Tooltip>
      <TooltipTrigger>Delete</TooltipTrigger>
      <TooltipContent>Deletes the file. There is no undo.</TooltipContent>
    </Tooltip>
    {/* render puts the trigger's props on the caller's element: anything focusable can be described */}
    <Tooltip>
      <TooltipTrigger render={(props) => <a {...props} href="#share" />}>Share</TooltipTrigger>
      <TooltipContent>Copies a link to this file</TooltipContent>
    </Tooltip>
  </div>
);

const InputDemo = (): JSX.Element => (
  <div class="demo-column">
    <Input placeholder="A plain input" />
    <Input disabled value="Disabled" />
  </div>
);

const FieldDemo = (): JSX.Element => (
  <div class="demo-column">
    <Field id="demo-email" hint="We never share it">
      <FieldLabel>Email</FieldLabel>
      <FieldControl
        render={(props) => <Input {...props} type="email" placeholder="you@example.com" />}
      />
    </Field>
    <Field id="demo-name" error="A name is required" required>
      <FieldLabel>Name</FieldLabel>
      <FieldControl />
      <FieldMessage />
    </Field>
  </div>
);

const SelectDemo = (): JSX.Element => {
  const [value, setValue] = createSignal(1);
  return (
    <div class="demo-column">
      <Select
        items={["Apple", "Banana", "Cherry", { label: "Durian" }]}
        value={value()}
        onValueChange={setValue}
        label="Fruit"
      >
        <SelectTrigger />
        <SelectContent />
      </Select>
      {/* nothing chosen: the trigger shows the placeholder, and the first arrow picks the first option */}
      <Select items={["Small", "Medium", "Large"]} label="Size" placeholder="Pick a size">
        <SelectTrigger />
        <SelectContent />
      </Select>
    </div>
  );
};

const TextareaDemo = (): JSX.Element => (
  <div class="demo-column">
    <Textarea placeholder="A plain textarea" />
    <Field id="demo-notes" hint="Markdown is fine">
      <FieldLabel>Notes</FieldLabel>
      <FieldControl render={(props) => <Textarea {...props} rows={4} />} />
      <FieldMessage />
    </Field>
  </div>
);

const CheckboxDemo = (): JSX.Element => {
  const [checked, setChecked] = createSignal<"true" | "false" | "mixed">("mixed");
  return (
    <div class="demo-column">
      <Checkbox allowMixed value={checked()} onValueChange={setChecked}>
        {checked() === "mixed" ? "Some items" : "All items"}
      </Checkbox>
      <Checkbox>Send me the changelog</Checkbox>
    </div>
  );
};

const RadioDemo = (): JSX.Element => {
  const [value, setValue] = createSignal("standard");
  return (
    <RadioGroup
      values={["standard", "express", "pickup"]}
      value={value()}
      onValueChange={setValue}
      orientation="vertical"
    >
      {(option) => option}
    </RadioGroup>
  );
};

const TabsDemo = (): JSX.Element => {
  const [value, setValue] = createSignal(0);
  return (
    <Tabs
      items={3}
      value={value()}
      onValueChange={setValue}
      tab={(index) => ["Overview", "Activity", "Settings"][index] ?? ""}
      panel={(index) => <p class="demo-text">The panel of tab {index + 1}.</p>}
    />
  );
};

const AccordionDemo = (): JSX.Element => (
  <Accordion
    items={3}
    defaultValue={[0]}
    trigger={(index) => ["What is copied?", "What is a dependency?", "Why a test?"][index] ?? ""}
    panel={(index) =>
      [
        "The component, its sheet, its fixture and its conformance test. Behaviour stays in npm.",
        "@cssints/headless: the APG state machine, so a fix arrives with npm update.",
        "The same scenarios the release passed, run against your markup.",
      ][index] ?? ""
    }
  />
);

const SeparatorDemo = (): JSX.Element => (
  <div class="demo-column">
    <div class="demo-row">
      <span>Files</span>
      <Separator orientation="vertical" decorative />
      <span>Shared</span>
    </div>
    <Separator />
  </div>
);

const BadgeDemo = (): JSX.Element => (
  <div class="demo-row">
    <Badge>Neutral</Badge>
    <Badge tone="accent">Accent</Badge>
    <Badge tone="quiet">Quiet</Badge>
  </div>
);

const SkeletonDemo = (): JSX.Element => (
  <div class="demo-column">
    <Skeleton height="2.5rem" />
    <Skeleton width="60%" />
    <Skeleton width="40%" height="0.75rem" />
  </div>
);

const AlertDemo = (): JSX.Element => (
  <div class="demo-column">
    <Alert message="Your draft is saved.">
      <AlertTitle>Draft saved</AlertTitle>
      <AlertBody>Every change is kept until you publish.</AlertBody>
    </Alert>
    <Alert tone="invalid" message="The address is not valid.">
      <AlertTitle>Could not save</AlertTitle>
      <AlertBody>Enter an address in the form of name@example.com.</AlertBody>
    </Alert>
  </div>
);

const ToastDemo = (): JSX.Element => {
  // the page holds the controller; the stack is portalled, so one <Toaster> follows the queue from wherever it is rendered.
  // 6 s instead of the default 5, so the hover demo has time to be hovered.
  const toast = createToast({ timeout: 6000 });
  return (
    <div class="demo-column">
      <div class="demo-row">
        <Button tone="quiet" onClick={() => toast.show({ title: "Draft saved" })}>
          Info
        </Button>
        <Button
          tone="quiet"
          onClick={() =>
            toast.show({
              title: "Published",
              description: "The post is live for everyone.",
              tone: "success",
            })
          }
        >
          Success
        </Button>
        <Button
          tone="quiet"
          onClick={() =>
            toast.show({
              title: "Upload failed",
              description: "The file is larger than 10 MB.",
              tone: "error",
            })
          }
        >
          Error
        </Button>
        <Button
          tone="quiet"
          onClick={() =>
            toast.show({
              title: "Hover to pause the countdown",
              description:
                "The toast waits while the pointer is over it, and resumes where it stopped.",
            })
          }
        >
          Hover pause
        </Button>
        <Button
          tone="quiet"
          onClick={() => {
            // the queue keeps three: the first of the four is dropped as the fourth arrives, so the stack ends on the last three
            for (const title of ["First toast", "Second toast", "Third toast", "Fourth toast"]) {
              toast.show({ title });
            }
          }}
        >
          Queue four
        </Button>
      </div>
      <Toaster toast={toast} />
    </div>
  );
};

const MeterDemo = (): JSX.Element => (
  <div class="demo-column">
    <Meter label="Storage" value={64} />
    <Meter label="Upload" value={92} valueText="92% of the file sent" />
  </div>
);

// The page cannot drag a file in a screenshot, so the demo drops a synthetic one: the same `DataTransfer` and `DragEvent` a
// real drop makes, through the zone's own handler. The real drop works as well; the point is that a reader sees the
// accepted list and the announcement without preparing a file.
const FAKE_DROP_FILES = [
  { name: "photo.png", type: "image/png", bytes: 8 },
  { name: "cover.png", type: "image/png", bytes: 8 },
  { name: "notes.txt", type: "text/plain", bytes: 8 },
  { name: "scan.png", type: "image/png", bytes: 1024 * 1024 + 1 },
] as const;

const DropzoneDemo = (): JSX.Element => {
  const [accepted, setAccepted] = createSignal<ReadonlyArray<string>>([]);
  let host: HTMLDivElement | undefined;
  const drop = (fake: (typeof FAKE_DROP_FILES)[number]): void => {
    const zone = host?.querySelector<HTMLElement>('[data-part="dropzone"]');
    if (zone === undefined || zone === null) {
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(fake.bytes)], fake.name, { type: fake.type }));
    zone.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
    );
  };
  return (
    <div
      class="demo-column"
      ref={(element: HTMLDivElement) => {
        host = element;
      }}
    >
      <Dropzone
        label="Upload an image"
        description="PNG or JPEG, up to 1 MB, two files per batch."
        accept="image/*"
        maxSize={1024 * 1024}
        maxFiles={2}
        multiple
        onFiles={(files) => setAccepted(files.map((file) => file.name))}
      >
        <DropzoneBrowse>Browse files</DropzoneBrowse>
      </Dropzone>
      <div class="demo-row">
        <For each={FAKE_DROP_FILES}>
          {(fake) => (
            <Button size="sm" tone="quiet" onClick={() => drop(fake)}>
              Drop {fake.name}
            </Button>
          )}
        </For>
      </div>
      <p class="demo-text">
        Accepted: {accepted().length === 0 ? "nothing yet" : accepted().join(", ")}
      </p>
    </div>
  );
};

const BREADCRUMB_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Q3 report", href: "#report" },
];

const BreadcrumbDemo = (): JSX.Element => (
  <Breadcrumb items={BREADCRUMB_ITEMS} currentIndex={3}>
    <BreadcrumbList>
      {BREADCRUMB_ITEMS.map((item, index) => (
        <BreadcrumbItem index={index}>
          <BreadcrumbLink index={index}>{item.label}</BreadcrumbLink>
        </BreadcrumbItem>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);

const TREEVIEW_NODES = [
  { id: 1, parent: 0, label: "Projects" },
  { id: 2, parent: 1, label: "Reports" },
  { id: 3, parent: 2, label: "Roadmap" },
  { id: 4, parent: 2, label: "Summary" },
  { id: 5, parent: 1, label: "Notes" },
  { id: 6, parent: 0, label: "Photos" },
];

const TreeviewDemo = (): JSX.Element => (
  <Treeview nodes={TREEVIEW_NODES} defaultValue={[2]} defaultExpanded={[1, 2]} label="Files" />
);
const SliderDemo = (): JSX.Element => {
  const [volume, setVolume] = createSignal(4);
  return (
    <div class="demo-column">
      <Slider label="Volume" value={volume()} onValueChange={setVolume} />
      <div class="demo-row">
        {/* vertical: the rail is as tall as the theme's space.10, and a page sets its own height */}
        <Slider label="Zoom" min={1} max={4} defaultValue={2} orientation="vertical" />
      </div>
    </div>
  );
};

const SliderMultithumbDemo = (): JSX.Element => {
  const [price, setPrice] = createSignal<readonly [number, number]>([20, 80]);
  return (
    <div class="demo-column">
      {/* the two thumbs cannot pass each other, and the fill is the interval between them */}
      <SliderMultithumb
        label="Price"
        min={0}
        max={100}
        step={10}
        value={price()}
        onValueChange={setPrice}
      />
      {/* disabled: both thumbs keep their tab stops, announce it, and no key or press changes the pair */}
      <SliderMultithumb
        label="Price (unavailable)"
        min={0}
        max={100}
        step={10}
        defaultValue={[30, 70]}
        disabled
      />
    </div>
  );
};

const SpinbuttonDemo = (): JSX.Element => {
  const [quantity, setQuantity] = createSignal(3);
  return (
    <div class="demo-column">
      {/* Field names the control: the spinbutton takes the field's id as its input's, so the label points at it */}
      <Field id="demo-quantity" hint="Up to 12">
        <FieldLabel>Quantity</FieldLabel>
        <FieldControl
          render={(props) => (
            <Spinbutton
              {...props}
              min={1}
              max={12}
              value={quantity()}
              onValueChange={setQuantity}
            />
          )}
        />
        <FieldMessage />
      </Field>
      {/* at the bound the primitive announces the stepper as disabled and the kit paints and disables it */}
      <Spinbutton aria-label="Copies" min={1} max={5} defaultValue={5} />
    </div>
  );
};

const CheckboxGroupDemo = (): JSX.Element => {
  const [channels, setChannels] = createSignal<ReadonlyArray<string>>(["email"]);
  return (
    <CheckboxGroup
      label="Notifications"
      values={["email", "push", "sms"]}
      value={channels()}
      onValueChange={setChannels}
      parent
      parentLabel="All channels"
    >
      {(channel) => channel}
    </CheckboxGroup>
  );
};
const PopoverDemo = (): JSX.Element => {
  const [open, setOpen] = createSignal(false);
  const [name, setName] = createSignal("Report Q3");
  return (
    <div class="demo-column">
      {/* a controlled popover: every intent (the trigger, Escape, an outside press) is a request the host accepts */}
      <Popover label="Rename file" open={open()} onOpenChange={setOpen} placement="bottom-start">
        <PopoverTrigger>Rename</PopoverTrigger>
        <PopoverContent>
          <div class="demo-column">
            <Input value={name()} onInput={(event) => setName(event.currentTarget.value)} />
            <div class="demo-row">
              <Button tone="quiet" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button tone="accent" onClick={() => setOpen(false)}>
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <p class="demo-text">The name is “{name()}”.</p>
    </div>
  );
};

const DatePickerDemo = (): JSX.Element => {
  const [date, setDate] = createSignal<string | undefined>(undefined);
  return (
    <div class="demo-column">
      {/* the trigger shows the chosen day; the signal below is the same value the page would submit */}
      <DatePicker value={date()} onValueChange={setDate}>
        <DatePickerTrigger />
        <DatePickerContent />
      </DatePicker>
      <p class="demo-text">
        {date() === undefined ? "No date chosen yet." : `The form would send ${date()}.`}
      </p>
    </div>
  );
};

/** The demo for an item; a new starter adds one line here. */
export const demos: Readonly<Record<string, () => JSX.Element>> = {
  switch: SwitchDemo,
  card: CardDemo,
  field: FieldDemo,
  input: InputDemo,
  dialog: DialogDemo,
  toolbar: ToolbarDemo,
  disclosure: DisclosureDemo,
  button: ButtonDemo,
  "button-group": ButtonGroupDemo,
  checkbox: CheckboxDemo,
  radio: RadioDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  separator: SeparatorDemo,
  badge: BadgeDemo,
  skeleton: SkeletonDemo,
  alert: AlertDemo,
  dropzone: DropzoneDemo,
  meter: MeterDemo,
  breadcrumb: BreadcrumbDemo,
  treeview: TreeviewDemo,
  menu: MenuDemo,
  menubar: MenubarDemo,
  tooltip: TooltipDemo,
  popover: PopoverDemo,
  "date-picker": DatePickerDemo,
  select: SelectDemo,
  textarea: TextareaDemo,
  slider: SliderDemo,
  "slider-multithumb": SliderMultithumbDemo,
  spinbutton: SpinbuttonDemo,
  "checkbox-group": CheckboxGroupDemo,
  toast: ToastDemo,
};
