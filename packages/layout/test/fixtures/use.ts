import { cn, media, p, token } from "cssints" with { type: "cssints" };
import {
  autoGrid,
  cluster,
  cover,
  sidebar,
  stack,
  switcher,
} from "@cssints/layout" with { type: "cssints" };

const space = token.length("24px", "space-md");

export const plain = stack();
export const page = cn(stack().gap(4), p(2));
export const toolbar = cluster().gap(space).justify("space-between").align("baseline");
export const aside = sidebar().side("right").width("20rem").content("60%").gap(2);
export const left = sidebar();
export const buttons = switcher().threshold("30rem").gap(1);
export const hero = cover().minHeight("100dvh");
export const cards = autoGrid().min("16rem").gap(4);
export const wide = media("(width >= 40rem)")(stack().gap(8));
