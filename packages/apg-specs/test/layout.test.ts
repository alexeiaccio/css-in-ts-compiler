import { describe, expect, it } from "vite-plus/test";
import { isSharedSpec, specRelToOutRel } from "../src/layout";

describe("apg-specs workspace layout", () => {
  it("maps a service spec to its generated model path", () => {
    expect(specRelToOutRel("specs/apg/tabs.qnt")).toBe("src/apg/tabs.model.generated.json");
    expect(specRelToOutRel("specs/canvas/camera.qnt")).toBe(
      "src/canvas/camera.model.generated.json",
    );
  });

  it("accepts either path separator", () => {
    expect(specRelToOutRel("specs\\apg\\tabs.qnt")).toBe("src/apg/tabs.model.generated.json");
  });

  it("treats shared modules as not generated", () => {
    expect(isSharedSpec("specs/shared/cbor.qnt")).toBe(true);
    expect(isSharedSpec("specs/shared/nested/base.qnt")).toBe(true);
    expect(isSharedSpec("specs/apg/tabs.qnt")).toBe(false);
  });
});
