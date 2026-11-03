// The paper the docs' code sits on. It is a pair of literals rather than a token: the syntax colours are painted at a
// contrast floor against it (plugin/code.ts derives them from the default palette), and a palette whose own subtle paper is
// darker or warmer would take fixed colours below that floor — munsell's light bgSubtle does. So a code block keeps the
// paper of the default palette's subtle one, in the mode's colours, and the block reads the same in every palette.
export const CODE_PAPER = { light: "#f7f5fa", dark: "#18131f" } as const;
export type CodeMode = keyof typeof CODE_PAPER;
