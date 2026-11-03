// The drop zone's stories: a target in the page's layout, so nothing is portalled. A real file cannot be provided here — the
// zone takes a drop or the OS picker behind the browse button, and both are the reader's gesture — so the stories show the
// target honestly and the line under it reports what `onFiles` received. `multiple` is the second mode the primitive has.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { Dropzone, DropzoneBrowse } from "./dropzone.tsx";

const meta = { title: "Drop zone" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: (): JSX.Element => {
    const [picked, setPicked] = createSignal("No batch yet.");
    return (
      <div class="demo-column">
        <Dropzone
          label="Upload an image"
          description="PNG or JPEG, up to 2 MB."
          accept="image/*"
          maxSize={2 * 1024 * 1024}
          onFiles={(files) => setPicked(files.map((file) => file.name).join(", "))}
        >
          <DropzoneBrowse />
        </Dropzone>
        <p class="demo-text">Accepted: {picked()}</p>
      </div>
    );
  },
};

export const Multiple: Story = {
  render: (): JSX.Element => {
    const [picked, setPicked] = createSignal("No batch yet.");
    return (
      <div class="demo-column">
        <Dropzone
          label="Upload the screenshots"
          description="Up to three PNGs at a time."
          accept="image/png"
          multiple
          maxFiles={3}
          onFiles={(files) => setPicked(files.map((file) => file.name).join(", "))}
        >
          <DropzoneBrowse>Choose screenshots</DropzoneBrowse>
        </Dropzone>
        <p class="demo-text">Accepted: {picked()}</p>
      </div>
    );
  },
};
