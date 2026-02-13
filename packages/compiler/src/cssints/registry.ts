/**
 * Registry - Global registry for collecting CSS styles
 */

import type { CSSProperties } from "./index";

export interface StyleEntry {
	fileId: string;
	className: string;
	properties: CSSProperties;
}

class StyleRegistry {
	private entries: Map<string, StyleEntry> = new Map();
	private fileEntries: Map<string, StyleEntry[]> = new Map();

	register(entry: StyleEntry): void {
		const key = `${entry.fileId}:${entry.className}`;
		if (!this.entries.has(key)) {
			this.entries.set(key, entry);
			
			// Track by file
			if (!this.fileEntries.has(entry.fileId)) {
				this.fileEntries.set(entry.fileId, []);
			}
			this.fileEntries.get(entry.fileId)!.push(entry);
		}
	}

	getByFile(fileId: string): StyleEntry[] {
		return this.fileEntries.get(fileId) || [];
	}

	getAll(): StyleEntry[] {
		return Array.from(this.entries.values());
	}

	generateCSS(fileId: string): string {
		const entries = this.getByFile(fileId);
		if (entries.length === 0) return "";

		const cssParts: string[] = [];
		for (const entry of entries) {
			cssParts.push(generateClassCSS(entry.className, entry.properties));
		}
		return cssParts.join("\n\n");
	}

	generateAllCSS(): string {
		const entries = this.getAll();
		if (entries.length === 0) return "";

		const cssParts: string[] = [];
		for (const entry of entries) {
			cssParts.push(generateClassCSS(entry.className, entry.properties));
		}
		return cssParts.join("\n\n");
	}

	clear(): void {
		this.entries.clear();
		this.fileEntries.clear();
	}

	clearFile(fileId: string): void {
		const entries = this.fileEntries.get(fileId) || [];
		for (const entry of entries) {
			const key = `${entry.fileId}:${entry.className}`;
			this.entries.delete(key);
		}
		this.fileEntries.delete(fileId);
	}
}

function generateClassCSS(className: string, properties: CSSProperties): string {
	const cssProps: string[] = [];

	for (const [key, value] of Object.entries(properties)) {
		if (typeof value === "object" && value !== null) {
			// Handle nested selectors (media queries, pseudos)
			cssProps.push(`${key} {`);
			const nestedProps = generateNestedCSS(value as CSSProperties);
			cssProps.push(nestedProps.map((p) => `  ${p}`).join("\n"));
			cssProps.push("}");
		} else {
			cssProps.push(`  ${key}: ${value};`);
		}
	}

	return `.${className} {\n${cssProps.join("\n")}\n}`;
}

function generateNestedCSS(properties: CSSProperties): string[] {
	const props: string[] = [];
	for (const [key, value] of Object.entries(properties)) {
		if (typeof value === "object" && value !== null) {
			props.push(`${key} {`);
			const nestedProps = generateNestedCSS(value as CSSProperties);
			props.push(nestedProps.map((p) => `  ${p}`).join("\n"));
			props.push("}");
		} else {
			props.push(`${key}: ${value};`);
		}
	}
	return props;
}

export const registry = new StyleRegistry();
