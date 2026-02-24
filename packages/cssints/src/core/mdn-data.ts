import type * as BSD from "@mdn/browser-compat-data/types";

import bcd from "@mdn/browser-compat-data" with { type: "json" };
import webref from "@webref/css";

const compat = bcd.css.types as unknown as Record<string, BSD.CompatStatement>;

export async function getCompatTypes() {
	return {
		...(await webref.listAll()).types.find((t) => t.name === "length"),
		...compat.length,
	};
}

if (import.meta.vitest) {
	const { it, expect, describe } = import.meta.vitest;
	describe("mdn-data", () => {
		it("works", async () => {
			const data = await getCompatTypes();

			expect(data).toMatchInlineSnapshot(`
				{
				  "Q": {
				    "__compat": {
				      "description": "<code>Q</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "63",
				        },
				        "chrome_android": {
				          "version_added": "63",
				        },
				        "edge": {
				          "version_added": "79",
				        },
				        "firefox": {
				          "version_added": "49",
				        },
				        "firefox_android": {
				          "version_added": "49",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "50",
				        },
				        "opera_android": {
				          "version_added": "46",
				        },
				        "safari": {
				          "version_added": "13.1",
				        },
				        "safari_ios": {
				          "version_added": "13.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "8.0",
				        },
				        "webview_android": {
				          "version_added": "63",
				        },
				        "webview_ios": {
				          "version_added": "13.4",
				        },
				      },
				      "tags": [
				        "web-features:q-unit",
				      ],
				    },
				  },
				  "__compat": {
				    "description": "<code>&lt;length&gt;</code>",
				    "mdn_url": "https://developer.mozilla.org/docs/Web/CSS/Reference/Values/length",
				    "source_file": "css/types/length.json",
				    "spec_url": "https://drafts.csswg.org/css-values/#lengths",
				    "status": {
				      "deprecated": false,
				      "experimental": false,
				      "standard_track": true,
				    },
				    "support": {
				      "chrome": {
				        "version_added": "1",
				      },
				      "chrome_android": {
				        "version_added": "18",
				      },
				      "edge": {
				        "version_added": "12",
				      },
				      "firefox": {
				        "version_added": "1",
				      },
				      "firefox_android": {
				        "version_added": "4",
				      },
				      "ie": {
				        "version_added": "3",
				      },
				      "oculus": {
				        "version_added": "5.0",
				      },
				      "opera": {
				        "version_added": "3.5",
				      },
				      "opera_android": {
				        "version_added": "10.1",
				      },
				      "safari": {
				        "version_added": "1",
				      },
				      "safari_ios": {
				        "version_added": "1",
				      },
				      "samsunginternet_android": {
				        "version_added": "1.0",
				      },
				      "webview_android": {
				        "version_added": "1",
				      },
				      "webview_ios": {
				        "version_added": "1",
				      },
				    },
				    "tags": [
				      "web-features:width-height",
				    ],
				  },
				  "cap": {
				    "__compat": {
				      "description": "<code>cap</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "118",
				        },
				        "chrome_android": {
				          "version_added": "118",
				        },
				        "edge": {
				          "version_added": "118",
				        },
				        "firefox": {
				          "version_added": "97",
				        },
				        "firefox_android": {
				          "version_added": "97",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "104",
				        },
				        "opera_android": {
				          "version_added": "79",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "25.0",
				        },
				        "webview_android": {
				          "version_added": "118",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:cap",
				      ],
				    },
				  },
				  "ch": {
				    "__compat": {
				      "description": "<code>ch</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "27",
				        },
				        "chrome_android": {
				          "version_added": "27",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "notes": [
				            "From Firefox 1 to Firefox 3, <code>ch</code> was the width of the <em>M</em> character.",
				            "From Firefox 1 to Firefox 3, <code>ch</code> did not work with <a href="https://developer.mozilla.org/docs/Web/CSS/border-width"><code>border-width</code></a> and <a href="https://developer.mozilla.org/docs/Web/CSS/outline-width"><code>outline-width</code></a> CSS properties.",
				          ],
				          "version_added": "1",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "15",
				        },
				        "opera_android": {
				          "version_added": "15",
				        },
				        "safari": {
				          "version_added": "7",
				        },
				        "safari_ios": {
				          "version_added": "7",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "7",
				        },
				      },
				      "tags": [
				        "web-features:ch",
				      ],
				    },
				  },
				  "container_query_length_units": {
				    "__compat": {
				      "description": "Container query length units <code>cqw</code>, <code>cqh</code>, <code>cqi</code>, <code>cqb</code>, <code>cqmin</code>, <code>cqmax</code>",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "105",
				        },
				        "chrome_android": {
				          "version_added": "105",
				        },
				        "edge": {
				          "version_added": "105",
				        },
				        "firefox": {
				          "version_added": "110",
				        },
				        "firefox_android": {
				          "version_added": "110",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "91",
				        },
				        "opera_android": {
				          "version_added": "72",
				        },
				        "safari": {
				          "version_added": "16",
				        },
				        "safari_ios": {
				          "version_added": "16",
				        },
				        "samsunginternet_android": {
				          "version_added": "20.0",
				        },
				        "webview_android": {
				          "version_added": "105",
				        },
				        "webview_ios": {
				          "version_added": "16",
				        },
				      },
				      "tags": [
				        "web-features:container-queries",
				      ],
				    },
				  },
				  "em": {
				    "__compat": {
				      "description": "<code>em</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "1",
				        },
				        "chrome_android": {
				          "version_added": "18",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "version_added": "1",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "3",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "3.5",
				        },
				        "opera_android": {
				          "version_added": "10.1",
				        },
				        "safari": {
				          "version_added": "1",
				        },
				        "safari_ios": {
				          "version_added": "1",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.0",
				        },
				        "webview_android": {
				          "version_added": "1",
				        },
				        "webview_ios": {
				          "version_added": "1",
				        },
				      },
				      "tags": [
				        "web-features:em-unit",
				      ],
				    },
				  },
				  "ex": {
				    "__compat": {
				      "description": "<code>ex</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "1",
				        },
				        "chrome_android": {
				          "version_added": "18",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "version_added": "1",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "4",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "3.5",
				        },
				        "opera_android": {
				          "version_added": "10.1",
				        },
				        "safari": {
				          "version_added": "1",
				        },
				        "safari_ios": {
				          "version_added": "1",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.0",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "1",
				        },
				      },
				      "tags": [
				        "web-features:ex",
				      ],
				    },
				  },
				  "extended": [],
				  "href": "https://drafts.csswg.org/css-values-4/#length-value",
				  "ic": {
				    "__compat": {
				      "description": "<code>ic</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "106",
				        },
				        "chrome_android": {
				          "version_added": "106",
				        },
				        "edge": {
				          "version_added": "106",
				        },
				        "firefox": {
				          "version_added": "97",
				        },
				        "firefox_android": {
				          "version_added": "97",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "92",
				        },
				        "opera_android": {
				          "version_added": "72",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "20.0",
				        },
				        "webview_android": {
				          "version_added": "106",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:ic",
				      ],
				    },
				  },
				  "lh": {
				    "__compat": {
				      "description": "<code>lh</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#lh",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "109",
				        },
				        "chrome_android": {
				          "version_added": "109",
				        },
				        "edge": {
				          "version_added": "109",
				        },
				        "firefox": {
				          "version_added": "120",
				        },
				        "firefox_android": {
				          "version_added": "120",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "95",
				        },
				        "opera_android": {
				          "version_added": "74",
				        },
				        "safari": {
				          "version_added": "16.4",
				        },
				        "safari_ios": {
				          "version_added": "16.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "109",
				        },
				        "webview_ios": {
				          "version_added": "16.4",
				        },
				      },
				      "tags": [
				        "web-features:lh",
				      ],
				    },
				  },
				  "name": "length",
				  "prose": "Lengths refer to distance measurements and are denoted by <length> in the property definitions. A length is a dimension.",
				  "rcap": {
				    "__compat": {
				      "description": "<code>rcap</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rcap",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "118",
				        },
				        "chrome_android": {
				          "version_added": "118",
				        },
				        "edge": {
				          "version_added": "118",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "104",
				        },
				        "opera_android": {
				          "version_added": "79",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "25.0",
				        },
				        "webview_android": {
				          "version_added": "118",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:rcap",
				      ],
				    },
				  },
				  "rch": {
				    "__compat": {
				      "description": "<code>rch</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rch",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:rch",
				      ],
				    },
				  },
				  "rem": {
				    "__compat": {
				      "description": "<code>rem</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "4",
				        },
				        "chrome_android": {
				          "version_added": "18",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "version_added": "3.6",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "11.6",
				        },
				        "opera_android": {
				          "version_added": "12",
				        },
				        "safari": {
				          "version_added": "5",
				        },
				        "safari_ios": {
				          "version_added": "4",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.0",
				        },
				        "webview_android": {
				          "version_added": "2",
				        },
				        "webview_ios": {
				          "version_added": "4",
				        },
				      },
				      "tags": [
				        "web-features:rem",
				      ],
				    },
				  },
				  "rex": {
				    "__compat": {
				      "description": "<code>rex</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rex",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:rex",
				      ],
				    },
				  },
				  "ric": {
				    "__compat": {
				      "description": "<code>ric</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#ric",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:ric",
				      ],
				    },
				  },
				  "rlh": {
				    "__compat": {
				      "description": "<code>rlh</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rlh",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "120",
				        },
				        "firefox_android": {
				          "version_added": "120",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "16.4",
				        },
				        "safari_ios": {
				          "version_added": "16.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "16.4",
				        },
				      },
				      "tags": [
				        "web-features:rlh",
				      ],
				    },
				  },
				  "vb": {
				    "__compat": {
				      "description": "<code>vb</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "vh": {
				    "__compat": {
				      "description": "<code>vh</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "20",
				        },
				        "chrome_android": {
				          "version_added": "25",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "20",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "6",
				        },
				        "safari_ios": {
				          "version_added": "6",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "6",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				  "vi": {
				    "__compat": {
				      "description": "<code>vi</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "viewport_percentage_units_dynamic": {
				    "__compat": {
				      "description": "<code>dvb</code>, <code>dvh</code>, <code>dvi</code>, <code>dvmax</code>, <code>dvmin</code>, <code>dvw</code> units",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "viewport_percentage_units_large": {
				    "__compat": {
				      "description": "<code>lvb</code>, <code>lvh</code>, <code>lvi</code>, <code>lvmax</code>, <code>lvmin</code>, <code>lvw</code> units",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "viewport_percentage_units_small": {
				    "__compat": {
				      "description": "<code>svb</code>, <code>svh</code>, <code>svi</code>, <code>svmax</code>, <code>svmin</code>, <code>svw</code> units",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "vmax": {
				    "__compat": {
				      "description": "<code>vmax</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "26",
				        },
				        "chrome_android": {
				          "version_added": "26",
				        },
				        "edge": {
				          "version_added": "16",
				        },
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "15",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "7",
				        },
				        "safari_ios": {
				          "version_added": "7",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "1.5",
				        },
				        "webview_ios": {
				          "version_added": "7",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				  "vmin": {
				    "__compat": {
				      "description": "<code>vmin</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "26",
				        },
				        "chrome_android": {
				          "version_added": "26",
				        },
				        "edge": [
				          {
				            "version_added": "12",
				          },
				          {
				            "alternative_name": "vm",
				            "version_added": "12",
				          },
				        ],
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": [
				          {
				            "version_added": "10",
				          },
				          {
				            "alternative_name": "vm",
				            "version_added": "9",
				          },
				        ],
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "15",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "7",
				        },
				        "safari_ios": {
				          "version_added": "7",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "7",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				  "vw": {
				    "__compat": {
				      "description": "<code>vw</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "20",
				        },
				        "chrome_android": {
				          "version_added": "25",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "20",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "6",
				        },
				        "safari_ios": {
				          "version_added": "6",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "6",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				}
			`);
		});
	});
}
