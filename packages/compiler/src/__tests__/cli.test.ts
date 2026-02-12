// CLI tests

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, unlinkSync, existsSync } from "fs";

import { build } from "../cli";
import { clearRegistry } from "../compiler";
import { clearThemeRegistry } from "../theme";

describe("CLI", () => {
	beforeEach(() => {
		clearRegistry();
		clearThemeRegistry();
	});

	afterEach(() => {
		clearRegistry();
		clearThemeRegistry();
	});

	describe("build()", () => {
		it("should write CSS to file when output path is provided", async () => {
			const { style, setFileScope } = await import("../compiler");

			setFileScope("/test.ts");
			style("test", { color: "blue" });

			const testFilePath = "/tmp/css-in-ts-test-output.css";
			await build("/test.ts", testFilePath);

			expect(existsSync(testFilePath)).toBe(true);

			const content = await Bun.file(testFilePath).text();
			expect(content).toContain("color: blue");

			if (existsSync(testFilePath)) {
				unlinkSync(testFilePath);
			}
		});

		it("should use [hash] placeholder in output filename", async () => {
			const { style, setFileScope } = await import("../compiler");

			setFileScope("/test.ts");
			style("test", { color: "green" });

			const testFilePath = "/tmp/css-in-ts-[hash].css";
			await build("/test.ts", testFilePath);

			const glob = new Bun.Glob("/tmp/css-in-ts-*.css");
			const files = await Array.fromAsync(glob.scan("/tmp"));

			expect(files.length).toBeGreaterThan(0);

			for (const file of files) {
				unlinkSync(file);
			}
		});

		it("should clear registry after build", async () => {
			const { style, setFileScope, getRegisteredClasses } = await import("../compiler");

			setFileScope("/test.ts");
			style("test", { color: "red" });

			expect(getRegisteredClasses().size).toBeGreaterThan(0);

			await build();

			expect(getRegisteredClasses().size).toBe(0);
		});
	});
});
