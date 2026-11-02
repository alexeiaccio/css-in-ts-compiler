---
# cssints-gvco
title: 'User: trusted publishers on npmjs.com for @cssints/gradient-2d (and later @cssints/color-names)'
status: completed
type: task
priority: normal
created_at: 2026-10-17T10:21:21Z
updated_at: 2026-11-02T12:21:19Z
---

RELEASING.md, Trusted publishers: once per new package, by hand. The first publish of a new package name is by hand too. Blocks the first release that contains the package.

- [ ] @cssints/gradient-2d
- [ ] @cssints/color-names (when it exists)



## Outcome (2026-11-02)

**Nothing to add by hand — both packages already publish through the trusted publisher.** 0.27.0 of `@cssints/gradient-2d` and of `@cssints/color-names` carries an SLSA provenance attestation whose workflow is `.github/workflows/release.yml`, repository `https://github.com/alexeiaccio/css-in-ts-compiler`, ref `refs/heads/master`, which means CI published them with OIDC (a trusted publisher) rather than a token.

Evidence, per package:

```bash
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@cssints%2fgradient-2d@0.27.0
# attestations[1].predicateType == https://slsa.dev/provenance/v1
# predicate.buildDefinition.externalParameters.workflow == {"ref":"refs/heads/master","repository":"https://github.com/alexeiaccio/css-in-ts-compiler","path":".github/workflows/release.yml"}
```

(The npm endpoint needs the slash escaped as `%2f`.) `cssints@0.27.0` shows the same, so the configuration is not specific to these two.
