import { createTextArea, createTextInput } from "../src/textbox";
import { describe, expect, it } from "vite-plus/test";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const mountInput = (options: Parameters<typeof createTextInput>[0] = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [value, setValue] = createSignal("");
  const dispose = render(() => {
    const textbox = createTextInput({
      ...options,
      get error() {
        return value() === "" ? options.error : undefined;
      },
      onValueChange: setValue,
    });
    return (
      <form novalidate>
        <label {...textbox.labelProps}>Name</label>
        <input {...textbox.controlProps} />
        <p {...textbox.hintProps}>Hint</p>
        <p {...textbox.errorProps}>Required</p>
      </form>
    );
  }, root);
  return {
    root,
    input: () => root.querySelector("input")!,
    value,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createTextInput", () => {
  it("labels the control and carries the field wiring", () => {
    const { root, input, dispose } = mountInput({ hint: "Hint", required: true });
    const label = root.querySelector("label")!;
    expect(label.getAttribute("for")).toBe(input().id);
    expect(input().getAttribute("type")).toBe("text");
    expect(input().required).toBe(true);
    expect(input().getAttribute("aria-required")).toBe("true");
    expect(input().getAttribute("aria-describedby")?.endsWith("-hint")).toBe(true);
    expect(input().hasAttribute("aria-invalid")).toBe(false);
    dispose();
  });

  it("announces the error when one is set", () => {
    const { root, input, dispose } = mountInput({ error: "Required" });
    const described = input().getAttribute("aria-describedby") ?? "";
    expect(described.split(" ").some((id) => id.endsWith("-error"))).toBe(true);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector('[role="alert"]')?.textContent).toBe("Required");
    dispose();
  });

  it("passes the autofill and input props through", () => {
    const { input, dispose } = mountInput({
      type: "email",
      autoComplete: "email",
      inputMode: "email",
      spellCheck: false,
      autoCapitalize: "none",
      maxLength: 4,
      name: "email",
      dir: "ltr",
    });
    expect(input().type).toBe("email");
    expect(input().autocomplete).toBe("email");
    expect(input().inputMode).toBe("email");
    expect(input().getAttribute("spellcheck")).toBe("false");
    expect(input().getAttribute("autocapitalize")).toBe("none");
    expect(input().maxLength).toBe(4);
    expect(input().name).toBe("email");
    dispose();
  });

  it("keeps a disabled control out of the tab order and a readOnly one in it", () => {
    const disabled = mountInput({ disabled: true });
    expect(disabled.input().disabled).toBe(true);
    disabled.dispose();

    const readOnly = mountInput({ readOnly: true });
    expect(readOnly.input().readOnly).toBe(true);
    expect(readOnly.input().disabled).toBe(false);
    readOnly.dispose();
  });

  it("reports what the element holds, and leaves maxLength to the browser", async () => {
    const { input, value, dispose } = mountInput({ maxLength: 3 });
    expect(input().maxLength).toBe(3);
    input().focus();
    input().value = "abc";
    input().dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(value()).toBe("abc");
    dispose();
  });
});

describe("createTextArea", () => {
  it("shares the field contract and adds rows, wrap and resize", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const dispose = render(() => {
      const area = createTextArea({
        id: "body",
        rows: 5,
        wrap: "hard",
        resize: "vertical",
        hint: "Markdown",
      });
      return (
        <>
          <label {...area.labelProps}>Body</label>
          <textarea {...area.controlProps} />
          <p {...area.hintProps}>Markdown</p>
          <p {...area.errorProps} />
        </>
      );
    }, root);
    const element = root.querySelector("textarea")!;
    expect(element.rows).toBe(5);
    expect(element.getAttribute("wrap")).toBe("hard");
    expect(element.style.resize).toBe("vertical");
    expect(element.getAttribute("aria-describedby")).toBe("body-hint");
    dispose();
    root.remove();
  });
});
