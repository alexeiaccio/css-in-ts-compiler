// Six posts of the Discover feed, as apps/csssky/test/fixtures/discover.json recorded them on 2026-10-02, cut to what the card
// reads. A facet is a byte range of the text (the API counts UTF-8 bytes).
import type { Post } from "./model.ts";

export const posts: Post[] = [
  {
    handle: "capecodfairytales.bsky.social",
    name: "Art & Nature",
    text: "#Poetry #Art #Morning\n\nIt is morning, and again\nI am the lucky person to be in it\n\n- Mary Oliver\n\n 🎨 Laurent Parcelier",
    createdAt: "2026-10-02T12:06:54.238Z",
    replies: 11,
    reposts: 75,
    likes: 642,
    facets: [
      {
        start: 0,
        end: 7,
        kind: "tag",
      },
      {
        start: 8,
        end: 12,
        kind: "tag",
      },
      {
        start: 13,
        end: 21,
        kind: "tag",
      },
    ],
  },
  {
    handle: "ronfilipkowski.bsky.social",
    name: "Ron Filipkowski",
    text: "I don’t think Kid Rock should continue to call himself Kid when he looks 102 years old",
    createdAt: "2026-10-02T12:15:42.776Z",
    replies: 271,
    reposts: 311,
    likes: 2846,
  },
  {
    handle: "annerabe.bsky.social",
    name: "Anne Rabe",
    text: "Ich war bei Uwe Steimles erstem Auftritt in Sachsen-Anhalt nach der Landtagswahl. Dort bin ich eingetaucht in eine erschreckende Parallelgesellschaft, deren Brutalität und Kälte mir Angst macht.\n(🎁-Link)",
    createdAt: "2026-10-02T11:30:38.686Z",
    replies: 156,
    reposts: 428,
    likes: 917,
    link: {
      uri: "https://www.zeit.de/feuilleton/2026-10/uwe-steimle-kabarett-ddr-hymne-zdf-sachsen-anhalt?freebie=5698d92d",
      title: "Uwe Steimle: Und dann entfesselt Uwe Steimle die Wut",
      description:
        "DDR-Hymne und Gewaltfantasien gegen eine ZDF-Moderatorin: Nach 36 Jahren kann die deutsche Einheit auch aussehen wie in Uwe Steimles Kabarett in Sachsen-Anhalt.",
    },
  },
  {
    handle: "altnps.bsky.social",
    name: "Alt National Park Service",
    text: "Amazing news! MLB has dropped its proposal for a baseball game in Grand Teton National Park! Thank you to everyone who pushed back and stood up for our parks!",
    createdAt: "2026-10-02T01:12:22.117Z",
    replies: 202,
    reposts: 2009,
    likes: 12086,
  },
  {
    handle: "buechereienwien.bsky.social",
    name: "Stadt Wien-Büchereien",
    text: "Im Wasserbehälter der Kaffeemaschine ist eine Schnecke. Laut Aquarien-Foren spricht das für die Wasserqualität, der Mitbewohner zeigt dennoch Anzeichen von Ekel.",
    createdAt: "2026-10-02T10:22:57.859Z",
    replies: 7,
    reposts: 10,
    likes: 153,
  },
  {
    handle: "m31author.bsky.social",
    name: "M31🍁",
    text: "OTTAWA — The actor and Parkinson’s disease advocate Michael J. Fox is set to be honoured at Rideau Hall this morning www.ctvnews.ca/entertainmen...",
    createdAt: "2026-10-02T11:01:48.930Z",
    replies: 21,
    reposts: 254,
    likes: 1391,
    facets: [
      {
        start: 121,
        end: 151,
        kind: "link",
        uri: "https://www.ctvnews.ca/entertainment/article/michael-j-fox-to-be-promoted-within-order-of-canada-at-rideau-hall-today/",
      },
    ],
    link: {
      uri: "https://www.ctvnews.ca/entertainment/article/michael-j-fox-to-be-promoted-within-order-of-canada-at-rideau-hall-today/",
      title: "Michael J. Fox to be promoted within Order of Canada at Rideau Hall today",
      description:
        "The actor and Parkinson’s disease advocate Michael J. Fox is set to be honoured at Rideau Hall this morning.",
    },
  },
];
