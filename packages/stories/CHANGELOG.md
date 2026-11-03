# @cssints/stories

## 0.31.0

### Minor Changes

- 2289227: A story declares its own `argTypes`, over the meta's: a file whose stories have different args gives each of them the
  controls it uses (`Story.argTypes`, merged per arg as CSF 3 merges it).

## 0.30.1

No changes in this release.

## 0.30.0

No changes in this release.

## 0.29.0

### Minor Changes

- 48507f1: `@cssints/stories`: the CSF 3 loader of a cssints storybook, published — `entries()`, `storyOfId()`, `parseHash()` and the `Meta`/`Story`/`ArgTypes` types, with the ids Storybook builds. It was the loader of `apps/ui` and `apps/lab`; a native storybook is the third reader, so it is a package instead of two copies.
