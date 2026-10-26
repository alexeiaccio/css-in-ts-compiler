import { createRoot } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { createField } from "../src/field";

// No DOM is needed: the field is attribute objects. The file is named
// *.browser.test.tsx only because that is what vite.config.ts includes.

const ids = (field: ReturnType<typeof createField>): string[] =>
  (field.controlProps["aria-describedby"] ?? "").split(" ").filter((id) => id !== "");

describe("createField", () => {
  it("makes stable, distinct ids from the base", () => {
    const field = createField({ id: "email" });
    const all = [
      field.controlProps.id,
      field.labelProps.id,
      field.hintProps.id,
      field.errorProps.id,
    ];
    expect(new Set(all).size).toBe(4);
    expect(field.labelProps.for).toBe(field.controlProps.id);
    expect(createField({ id: "email" }).controlProps.id).toBe(field.controlProps.id);
    expect(field.controlProps.id).toBe(field.controlProps.id);
  });

  it("makes its own base when none is given, and two fields differ", () => {
    createRoot((dispose) => {
      const a = createField();
      const b = createField();
      expect(a.controlProps.id).not.toBe(b.controlProps.id);
      expect(a.labelProps.for).toBe(a.controlProps.id);
      dispose();
    });
  });

  it("references nothing for a plain field", () => {
    const field = createField({ id: "f" });
    expect(field.controlProps["aria-describedby"]).toBeUndefined();
    expect(field.controlProps["aria-invalid"]).toBeUndefined();
    expect(field.controlProps["aria-required"]).toBeUndefined();
    expect(field.controlProps.required).toBeUndefined();
    expect(field.hintProps.hidden).toBe(true);
    expect(field.errorProps.hidden).toBe(true);
    expect(field.describedIds()).toEqual([]);
  });

  it("lists the hint, then the error, in aria-describedby", () => {
    const field = createField({ id: "f", hint: "8 characters or more", error: "Too short" });
    expect(field.describedIds()).toEqual([field.hintProps.id, field.errorProps.id]);
    expect(field.controlProps["aria-describedby"]).toBe(
      `${field.hintProps.id} ${field.errorProps.id}`,
    );
    expect(field.hintProps.hidden).toBe(false);
    expect(field.errorProps.hidden).toBe(false);
  });

  it("keeps the hint when an error appears (the error does not replace it)", () => {
    const state: { error: string | undefined } = { error: undefined };
    const field = createField({
      id: "f",
      hint: "Hint",
      get error() {
        return state.error;
      },
    });
    expect(field.describedIds()).toEqual([field.hintProps.id]);
    state.error = "Wrong";
    expect(field.describedIds()).toEqual([field.hintProps.id, field.errorProps.id]);
    state.error = undefined;
    expect(field.describedIds()).toEqual([field.hintProps.id]);
  });

  it("sets aria-invalid only when invalid", () => {
    expect(createField({ id: "f" }).controlProps["aria-invalid"]).toBeUndefined();
    expect(createField({ id: "f", invalid: false }).controlProps["aria-invalid"]).toBeUndefined();
    expect(createField({ id: "f", invalid: true }).controlProps["aria-invalid"]).toBe("true");
    expect(createField({ id: "f", invalid: "Required" }).controlProps["aria-invalid"]).toBe("true");
    expect(createField({ id: "f", error: "Bad" }).controlProps["aria-invalid"]).toBe("true");
    expect(
      createField({ id: "f", hint: "Only a hint" }).controlProps["aria-invalid"],
    ).toBeUndefined();
  });

  it("takes the message from invalid when error is not set, and error wins otherwise", () => {
    const fromInvalid = createField({ id: "f", invalid: "Pick one" });
    expect(fromInvalid.error()).toBe("Pick one");
    expect(fromInvalid.describedIds()).toEqual([fromInvalid.errorProps.id]);
    expect(createField({ id: "f", invalid: "Pick one", error: "Taken" }).error()).toBe("Taken");
  });

  it("invalid without a message marks the control and references no error", () => {
    const field = createField({ id: "f", invalid: true });
    expect(field.controlProps["aria-invalid"]).toBe("true");
    expect(field.errorProps.hidden).toBe(true);
    expect(field.controlProps["aria-describedby"]).toBeUndefined();
  });

  it("invalid: false hides a ready error and drops its reference", () => {
    const field = createField({ id: "f", hint: "Hint", error: "Bad", invalid: false });
    expect(field.invalid()).toBe(false);
    expect(field.error()).toBeUndefined();
    expect(field.errorProps.hidden).toBe(true);
    expect(field.describedIds()).toEqual([field.hintProps.id]);
  });

  it("treats an empty string as absent", () => {
    const field = createField({ id: "f", hint: "", error: "", invalid: "" });
    expect(field.invalid()).toBe(false);
    expect(field.describedIds()).toEqual([]);
    expect(field.hintProps.hidden).toBe(true);
  });

  it("sets required and aria-required together", () => {
    const field = createField({ id: "f", required: true });
    expect(field.controlProps.required).toBe(true);
    expect(field.controlProps["aria-required"]).toBe("true");
    expect(createField({ id: "f", required: false }).controlProps.required).toBeUndefined();
  });

  it("never references an id whose element is hidden", () => {
    const hints = [undefined, "Hint"];
    const errors = [undefined, "Error"];
    const invalids = [undefined, true, false, "Message"];
    for (const hint of hints) {
      for (const error of errors) {
        for (const invalid of invalids) {
          const field = createField({ id: "f", hint, error, invalid });
          const hidden = new Set<string>();
          for (const part of [field.hintProps, field.errorProps]) {
            if (part.hidden) {
              hidden.add(part.id);
            }
          }
          for (const id of ids(field)) {
            expect(hidden.has(id)).toBe(false);
            expect([field.hintProps.id, field.errorProps.id]).toContain(id);
          }
          expect(ids(field)).toEqual(field.describedIds());
        }
      }
    }
  });
});
