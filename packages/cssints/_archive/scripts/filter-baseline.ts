/**
 * Baseline Filter Module
 *
 * Filters CSS features to modern baseline using browserslist and MDN compat data.
 * Removes vendor prefixes, deprecated, and experimental features.
 */

import bcd from "@mdn/browser-compat-data" with { type: "json" };
import browserslist from "browserslist";

export type FeatureStatus = "modern" | "experimental" | "deprecated";

export interface CSSFeature {
	name: string;
	syntax: string;
	spec: string;
	status: FeatureStatus;
	browserSupport: {
		chrome?: string;
		firefox?: string;
		safari?: string;
		edge?: string;
	};
}

const VENDOR_PREFIXES = ["-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"];

function hasVendorPrefix(name: string): boolean {
	return VENDOR_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function getBrowserVersions(bcdKey: string): CSSFeature["browserSupport"] {
	const parts = bcdKey.split(".");
	let current: unknown = bcd;

	for (const part of parts) {
		if (current && typeof current === "object" && part in current) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return {};
		}
	}

	const support = (current as { __compat?: { support?: unknown } }).__compat?.support;
	if (!support || typeof support !== "object") {
		return {};
	}

	const result: CSSFeature["browserSupport"] = {};
	const supportObj = support as Record<string, unknown>;

	// Chrome
	if (supportObj.chrome) {
		const chromeSupport = Array.isArray(supportObj.chrome) ? supportObj.chrome[0] : supportObj.chrome;
		if (typeof chromeSupport === "object" && chromeSupport && "version_added" in chromeSupport) {
			result.chrome = String((chromeSupport as { version_added: unknown }).version_added);
		}
	}

	// Firefox
	if (supportObj.firefox) {
		const ffSupport = Array.isArray(supportObj.firefox) ? supportObj.firefox[0] : supportObj.firefox;
		if (typeof ffSupport === "object" && ffSupport && "version_added" in ffSupport) {
			result.firefox = String((ffSupport as { version_added: unknown }).version_added);
		}
	}

	// Safari
	if (supportObj.safari) {
		const safariSupport = Array.isArray(supportObj.safari) ? supportObj.safari[0] : supportObj.safari;
		if (typeof safariSupport === "object" && safariSupport && "version_added" in safariSupport) {
			result.safari = String((safariSupport as { version_added: unknown }).version_added);
		}
	}

	// Edge
	if (supportObj.edge) {
		const edgeSupport = Array.isArray(supportObj.edge) ? supportObj.edge[0] : supportObj.edge;
		if (typeof edgeSupport === "object" && edgeSupport && "version_added" in edgeSupport) {
			result.edge = String((edgeSupport as { version_added: unknown }).version_added);
		}
	}

	return result;
}

function determineStatus(
	browserSupport: CSSFeature["browserSupport"],
	targetBrowsers: string[],
): FeatureStatus {
	// Get target versions from browserslist
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const targets = browserslist(targetBrowsers as any);
	const targetVersions: Record<string, number> = {};

	for (const target of targets) {
		const [browser, version] = target.split(" ");
		if (browser && version) {
			targetVersions[browser] = parseFloat(version);
		}
	}

	// Check if all major browsers support it at target versions
	const hasSupport = (browser: string, version?: string): boolean => {
		if (!version) return false;
		const targetVersion = targetVersions[browser];
		if (!targetVersion) return true; // If not targeting this browser, assume support
		const numericVersion = parseFloat(version);
		return !Number.isNaN(numericVersion) && numericVersion <= targetVersion;
	};

	const chromeOk = hasSupport("chrome", browserSupport.chrome);
	const firefoxOk = hasSupport("firefox", browserSupport.firefox);
	const safariOk = hasSupport("safari", browserSupport.safari);

	// If supported in all major browsers at target versions, it's modern
	if (chromeOk && firefoxOk && safariOk) {
		return "modern";
	}

	// If version_added is false or null, it's deprecated or not supported
	if (
		browserSupport.chrome === "false" ||
		browserSupport.firefox === "false" ||
		browserSupport.safari === "false"
	) {
		return "deprecated";
	}

	return "experimental";
}

export function filterFeatures(
	features: Array<{ name: string; syntax: string; spec: string }>,
	options?: {
		status?: FeatureStatus[];
		includeVendorPrefixed?: boolean;
	},
): CSSFeature[] {
	const { status = ["modern"], includeVendorPrefixed = false } = options ?? {};
	const targetBrowsers: string[] = ["last 2 versions"];

	return features
		.filter((feature) => {
			// Filter vendor prefixes
			if (!includeVendorPrefixed && hasVendorPrefix(feature.name)) {
				return false;
			}
			return true;
		})
		.map((feature) => {
			// Try to get browser support from BCD
			const bcdKey = `css.properties.${feature.name}`;
			const browserSupport = getBrowserVersions(bcdKey);
			const featureStatus = determineStatus(browserSupport, targetBrowsers);

			return {
				...feature,
				status: featureStatus,
				browserSupport,
			};
		})
		.filter((feature) => status.includes(feature.status));
}

export function filterFunctions(
	functions: Array<{ name: string; syntax: string; spec: string }>,
	options?: Parameters<typeof filterFeatures>[1],
): CSSFeature[] {
	return filterFeatures(functions, options);
}

export function filterProperties(
	properties: Array<{ name: string; syntax: string; spec: string }>,
	options?: Parameters<typeof filterFeatures>[1],
): CSSFeature[] {
	return filterFeatures(properties, options);
}
