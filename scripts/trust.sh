#!/bin/sh
# Adds the GitHub Actions trusted publisher (release.yml) to every package of the fixed group. Run once, after the first
# release, right before the first CI release (a configuration expires if no publish goes through it within 2 days).
# npm asks for 2FA on each call; RELEASING.md "Trusted publishers".
set -e
for p in $(node -e 'console.log(require("./.changeset/config.json").fixed[0].join(" "))'); do
  echo "$p"
  npm trust github "$p" --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes
done
