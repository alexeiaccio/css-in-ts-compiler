# References

[Haz's post](https://bsky.app/profile/haz.dev/post/3mebm2mx6jk27)

```
Haz @haz.dev
My dream CSS framework:

⋅ CSS-in-TS
⋅ Composable utilities as fns `md(size(2))`
⋅ Plugins are just fns `custom(flex())`
⋅ Compiled to static CSS by default
⋅ Dynamic when needed `hover(prop)`
⋅ Class order matters

Maybe not possible?

5:13 PM · Feb 7, 2026
```

```
CSS is evolving quickly, but JS/TS are hard to beat for expressiveness, tooling, and type safety.

AI is also better at writing TS and may get even better with TSGO.

Thoughts?
```

```
🤔
I can't stop thinking about this.
Do we really want another CSS framework?

3:26 PM · Feb 10, 2026
```

### 5.5 Setting Variables (the set Mixin)

Variables are set via the set mixin, which is a plugin (part of the preset). It supports two forms:
Namespace form - for config-defined variables:

```ts
// Setting a namespaced variable
css.set.color.$primary("#000");
// → --color-primary: #000

// Setting a top-level variable
css.set.$spacing("0.1em");
// → --spacing: 0.1em

// Setting mid-chain
css.flex.col.set.color.$primary("#000");
// → display: flex; flex-direction: column; --color-primary: #000

// Setting inside a wrapping mixin (e.g., dark mode)
css.dark(css.set.color.$primary("#93c5fd").set.color.$white("#f0f0f0"));
// → @media (prefers-color-scheme: dark) { --color-primary: #93c5fd; --color-white: #f0f0f0 }
```

Callable form - for any variable, including defineVar() variables:

```ts
const custom = css.defineVar();

// Setting a custom variable mid-chain
css.flex.col.set(custom, "value");
// → display: flex; flex-direction: column; --dyn-a7Bk3: value

// Setting a config variable (equivalent to the namespace form)
css.set(css.vars.color.$primary, "#000");
// → --color-primary: #000
```

### 7.2 Custom Helper Functions

Percentage parameters accept both string percentages ("20%") and floating-point numbers between 0 and 1 (0.2) .Both forms are equivalent:

```ts
// color-mix) wrapper all equivalent
css.bg.mix.$primary.$white;
css.bg.mix.$primary.$white (0.5);
css.bg(css.mix.$primary.$white(0.5));
css.bg(css.mix(css.vars.color.$primary, css.vars.color $white, 0.5));
css.bg(css.mix(css.vars.color.$primary, css.vars.color.$white, "50%")) ;
// → background-color: color-mixin srgb, var (--color-primary), var(--color-white) 50%)

// Relative color syntax wrapper for lightening
css.bg.ligthen.$primary;
css.bg.ligthen $primary (0.1);
css.bg(css.lighten(css.vars.color.$primary, 0.1));
css.bg(css.lighten(css.vars.color.$primary, "10%"));
// → background-color: oklch(from var(--color-primary) calc (l + 0.1) c h)

// Relative color syntax wrapper for darkening
css.bg.darken.$primary;
css.bg.darken.$primary (0.1);
css.bg(css.darken(css.vars.color.$primary, 0.1));
css.bg(css.darken(css.vars.color.$primary, "10%"));
// → background-color: oklch(from var (--color-primary) calc(l - 0.1) c h)

// Opacity modifier
css.bg.alpha $primary(0.5);
css.bg(css.alpha(css.vars.color-$primary, 0.5));
css.bg (css.alpha(css.vars.color-$primary, "50%"));
// → background-color: oklch(from var(--color-primary) l ch / 50%)
```
