import { toDecls } from "./lib.mjs";

export const preeval = (...steps) => ({ __cssints: steps.flatMap(([member, args]) => toDecls(member, args)) });

