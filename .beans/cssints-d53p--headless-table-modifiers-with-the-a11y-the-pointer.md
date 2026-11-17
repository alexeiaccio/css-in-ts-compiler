---
# cssints-d53p
title: 'headless: table modifiers with the a11y the pointer version loses'
status: completed
type: feature
priority: normal
tags:
    - headless
    - a11y
created_at: 2026-11-17T06:14:11Z
updated_at: 2026-11-17T06:17:09Z
---

## Why

MuTable (Sun, Hayatpur, E, Sultanum, Xia — UIST '26, arXiv:2609.19294) reifies table transformations as persistent, composable, reusable **modifiers** over columns. The mechanic is worth having; a pointer-only version of it would not be.

## What

`packages/headless/src/modifiers.ts`: `createModifiers()` — a stack of units over columns.

- a unit spans columns and holds ordered `parts`, each with `slots` (its coverage by position), so a joined unit is a reusable sequence and retargeting it moves every step;
- one encoding has one owner: the topmost unit covering the column and declaring that encoding (`owner`, `encoded`), which is what makes the order mean something;
- `locked` carries which column is the input (a descriptor the host computes with, like a table's sort);
- ops: `add`, `remove`, `move`, `toggleTarget` (the brush), `lock`, `joinWithAbove`, `split`.

## a11y (the point of doing it here)

- the rail is a `toolbar` of menu buttons with one tab stop: arrows move focus, `Alt`+Arrow reorders (the drag's keyboard route), `Enter`/`Space`/`Shift+F10` opens the unit's menu (span checkboxes, lock radios, join/split), `Delete` removes;
- a unit's name is its span and its lock ("Color, applied to Audience, Critics, locked to Audience"), since the visible text is only the action;
- every structural change is announced through `createStatus`, and the message follows the **commit**, not the request: a controlled host that refuses a change gets no announcement;
- the lock names the input column instead of relying on a colour; encodings are decoration and the values stay text (`mark` is a smaller rendering, never `aria-hidden`).

No Quint spec: the stack is dataflow with no interleavings to model (`grid-sort.qnt` is the precedent for a descriptor), so `test/modifiers.test.ts` (15) is the oracle.

Skipped: the kit's rendering (colours, axes, aggregation), the drag itself (a pointer's `move` call), mouse-selection for a join (join-with-above needs no multi-select).


## Summary of Changes

- `packages/headless/src/modifiers.ts`: `createModifiers()` — units over columns with ordered `parts` (coverage by
  position), `owner`/`encoded` by the topmost covering unit, `locked` as a descriptor, and `add`/`remove`/`move`/
  `toggleTarget`/`lock`/`joinWithAbove`/`split`.
- The rail: a `toolbar` of menu buttons, one tab stop, arrows/Home/End, `Alt`+arrow reorder, Enter/Space/Shift+F10 menu,
  Delete remove; a unit's name is its span and its lock; a `createStatus` region announces the committed delta only.
- `test/modifiers.test.ts` (15): ownership by order, join/reuse/split, the brush, the lock, the announcements, a
  controlled host's refusal, the keyboard.
- `README.md` section, changeset `headless-modifiers`, a wayfinder entry.
- Skipped: a Quint spec (dataflow, no interleavings) and the kit's visuals.
