import { createCheckbox } from "../src/checkbox";
import { createCheckboxGroup } from "../src/checkbox-group";
import { createKnob } from "../src/knob";
import { createSlider } from "../src/slider";
import { createSliderMultiThumb } from "../src/slider-multithumb";
import { createSpinbutton } from "../src/spinbutton";
import { createSwitch } from "../src/switch";
import type { Feedback, FeedbackIntent } from "../src/feedback";
import { describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

/**
 * The emission contract, one primitive at a time: the sequence is the
 * assertion. `feedback` is output only (`src/feedback.ts`), so every case here
 * also proves the widget's own behaviour is untouched: a programmatic change
 * and a host writing `value` are silent.
 */

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => Promise.resolve();

/** Both channels record into one list per channel, so "same intent on both" is one assertion. */
const spy = () => {
  const haptic: FeedbackIntent[] = [];
  const sound: FeedbackIntent[] = [];
  return {
    haptic,
    sound,
    feedback: {
      haptic: (intent) => haptic.push(intent),
      sound: (intent) => sound.push(intent),
    } satisfies Feedback,
  };
};

const press = (element: HTMLElement, key: string, repeat = false): void => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, repeat, bubbles: true }));
};

const at = (root: HTMLElement, part: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-part="${part}"]`);
  if (element === null) {
    throw new Error(`no part ${part}`);
  }
  return element;
};

describe("createSlider feedback", () => {
  const mount = (value = 5) => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createSlider> | undefined;
    const dispose = render(() => {
      const slider = createSlider({ defaultValue: value, feedback: recorded.feedback });
      api = slider;
      return (
        <>
          <div {...slider.trackProps} />
          <div {...slider.thumbProps} />
        </>
      );
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("ticks a detent per step, a limit once against the bound, and nothing programmatically", async () => {
    const slider = mount(5);
    const thumb = at(slider.root, "thumb");
    thumb.focus();
    await tick();
    press(thumb, "ArrowRight");
    press(thumb, "ArrowRight");
    press(thumb, "ArrowLeft");
    await tick();
    expect(slider.haptic).toEqual(["detent", "detent", "detent"]);

    // at the bound: a held key repeats, the tick does not
    slider.api.setValue(10);
    await tick();
    press(thumb, "ArrowRight", true);
    press(thumb, "ArrowRight", true);
    press(thumb, "ArrowRight", true);
    await tick();
    expect(slider.haptic).toEqual(["detent", "detent", "detent", "limit"]);

    // a fresh press is a new interaction, so it ticks again
    press(thumb, "ArrowRight");
    await tick();
    expect(slider.haptic).toEqual(["detent", "detent", "detent", "limit", "limit"]);

    // the host writing a value is not a gesture
    slider.api.setValue(2);
    await tick();
    expect(slider.haptic).toHaveLength(5);
    slider.dispose();
  });

  it("hears the same intents on both channels", async () => {
    const slider = mount(5);
    const thumb = at(slider.root, "thumb");
    thumb.focus();
    await tick();
    press(thumb, "ArrowUp");
    await tick();
    expect(slider.sound).toEqual(["detent"]);
    expect(slider.haptic).toEqual(["detent"]);
    slider.dispose();
  });
});

describe("createKnob feedback", () => {
  const mount = (value = 50) => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createKnob> | undefined;
    const dispose = render(() => {
      const knob = createKnob({ defaultValue: value, feedback: recorded.feedback });
      api = knob;
      return <div {...knob.knobProps} />;
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("ticks a key, the wheel and a bound the same way", async () => {
    const knob = mount();
    const dial = at(knob.root, "knob");
    press(dial, "ArrowUp");
    press(dial, "ArrowDown");
    dial.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, bubbles: true }));
    dial.dispatchEvent(new WheelEvent("wheel", { deltaY: 1, bubbles: true }));
    await tick();
    expect(knob.haptic).toEqual(["detent", "detent", "detent", "detent"]);

    // a clamped dial stops at the bound; `setValue` moved it there silently
    knob.api.setValue(100);
    await tick();
    dial.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, bubbles: true }));
    dial.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, bubbles: true }));
    press(dial, "PageUp", true);
    await tick();
    expect(knob.haptic).toEqual(["detent", "detent", "detent", "detent", "limit"]);

    // `stepBy` is a request like `setValue`: silent
    knob.api.stepBy(10);
    await tick();
    expect(knob.haptic).toHaveLength(5);
    expect(knob.sound).toEqual(knob.haptic);
    knob.dispose();
  });
});

describe("createSpinbutton feedback", () => {
  const mount = (value = 5) => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createSpinbutton> | undefined;
    const dispose = render(() => {
      const spinbutton = createSpinbutton({ defaultValue: value, feedback: recorded.feedback });
      api = spinbutton;
      return (
        <>
          <input {...spinbutton.inputProps} />
          <button {...spinbutton.incrementProps} />
        </>
      );
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("ticks a key and a stepper, one limit at the bound, nothing for a programmatic change", async () => {
    const spinbutton = mount();
    const field = at(spinbutton.root, "input") as HTMLInputElement;
    field.focus();
    await tick();
    press(field, "ArrowUp");
    press(field, "PageUp");
    await tick();
    expect(spinbutton.haptic).toEqual(["detent", "detent"]);

    at(spinbutton.root, "increment").click();
    await tick();
    expect(spinbutton.haptic).toEqual(["detent", "detent", "detent"]);

    spinbutton.api.setValue(12);
    await tick();
    press(field, "ArrowUp", true);
    press(field, "ArrowUp", true);
    await tick();
    expect(spinbutton.haptic).toEqual(["detent", "detent", "detent", "limit"]);

    spinbutton.api.setValue(1);
    await tick();
    expect(spinbutton.haptic).toHaveLength(4);
    expect(spinbutton.sound).toEqual(spinbutton.haptic);
    spinbutton.dispose();
  });
});

describe("createSwitch feedback", () => {
  const mount = () => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createSwitch> | undefined;
    const dispose = render(() => {
      const toggle = createSwitch({ feedback: recorded.feedback });
      api = toggle;
      return <div {...toggle.switchProps} />;
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("latches on, releases off, and says nothing for setChecked", async () => {
    const toggle = mount();
    const control = at(toggle.root, "switch");
    control.click();
    await tick();
    control.click();
    await tick();
    expect(toggle.haptic).toEqual(["latch", "release"]);
    expect(toggle.sound).toEqual(["latch", "release"]);

    toggle.api.setChecked(false);
    await tick();
    expect(toggle.haptic).toHaveLength(2);

    // Space arms on keydown and fires on keyup, as the pattern does
    control.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await tick();
    control.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));
    await tick();
    expect(toggle.haptic).toEqual(["latch", "release", "latch"]);
    toggle.dispose();
  });
});

describe("createCheckbox feedback", () => {
  const mount = () => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createCheckbox> | undefined;
    const dispose = render(() => {
      const box = createCheckbox({ allowMixed: true, feedback: recorded.feedback });
      api = box;
      return <div {...box.checkboxProps} />;
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("latches on, releases off, and says nothing for setChecked", async () => {
    const box = mount();
    const control = at(box.root, "checkbox");
    control.click();
    await tick();
    control.click();
    await tick();
    expect(box.haptic).toEqual(["latch", "release"]);

    // a mixed box checks: the user sees it turn on
    box.api.setChecked("mixed");
    await tick();
    control.click();
    await tick();
    expect(box.haptic).toEqual(["latch", "release", "latch"]);
    expect(box.sound).toEqual(["latch", "release", "latch"]);
    box.dispose();
  });
});

describe("createCheckboxGroup feedback", () => {
  const mount = () => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createCheckboxGroup<string>> | undefined;
    const dispose = render(() => {
      const group = createCheckboxGroup({
        values: ["a", "b", "c"],
        parent: true,
        feedback: recorded.feedback,
      });
      api = group;
      return (
        <div {...group.groupProps}>
          <div {...group.parentProps} />
          <div {...group.childProps(0)} />
        </div>
      );
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("reports the box the user activated: a child latches, the controller latches when all are on", async () => {
    const group = mount();
    const boxes = [...group.root.querySelectorAll<HTMLElement>('[data-part="checkbox"]')];
    const parent = boxes[0]!;
    const child = boxes[1]!;

    child.click();
    await tick();
    child.click();
    await tick();
    expect(group.haptic).toEqual(["latch", "release"]);

    // none -> all: the controller turned the group on
    parent.click();
    await tick();
    expect(group.haptic).toEqual(["latch", "release", "latch"]);

    // setChildren is the host writing the value, not a gesture
    group.api.setChildren([false, false, false]);
    await tick();
    expect(group.haptic).toHaveLength(3);
    expect(group.sound).toEqual(group.haptic);
    group.dispose();
  });
});

describe("createSliderMultiThumb feedback", () => {
  const mount = () => {
    const recorded = spy();
    const root = document.createElement("div");
    document.body.append(root);
    let api: ReturnType<typeof createSliderMultiThumb> | undefined;
    const dispose = render(() => {
      const slider = createSliderMultiThumb({ feedback: recorded.feedback });
      api = slider;
      return (
        <>
          <div {...slider.trackProps} />
          <div {...slider.thumbProps(0)} />
          <div {...slider.thumbProps(1)} />
        </>
      );
    }, root);
    return {
      ...recorded,
      root,
      api: api!,
      dispose: () => {
        dispose();
        root.remove();
      },
    };
  };

  it("ticks the thumb that moved and stops at its neighbour once", async () => {
    const slider = mount();
    const thumbs = [...slider.root.querySelectorAll<HTMLElement>('[data-part="thumb"]')];
    const lower = thumbs[0]!;
    lower.focus();
    await tick();
    press(lower, "ArrowRight");
    press(lower, "ArrowLeft");
    await tick();
    expect(slider.haptic).toEqual(["detent", "detent"]);

    // End jumps the lower thumb to its ceiling (the neighbour at 7), then a held
    // key against it ticks once
    press(lower, "End");
    await tick();
    expect(slider.haptic).toEqual(["detent", "detent", "detent"]);
    press(lower, "ArrowRight", true);
    press(lower, "ArrowRight", true);
    press(lower, "ArrowRight", true);
    press(lower, "ArrowRight", true);
    await tick();
    expect(slider.haptic).toEqual(["detent", "detent", "detent", "limit"]);

    slider.api.setValues([0, 10]);
    await tick();
    expect(slider.haptic).toHaveLength(4);
    expect(slider.sound).toEqual(slider.haptic);
    slider.dispose();
  });
});
