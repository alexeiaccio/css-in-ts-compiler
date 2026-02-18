---
# css-in-ts-compiler-6o7e
title: Add number to rem scale conversion
status: completed
type: task
priority: normal
created_at: 2026-02-18T10:17:57Z
updated_at: 2026-02-18T10:33:36Z
parent: css-in-ts-compiler-jphr
---

- [ ] Numbers convert: 4 → '1rem' (scale: 0.25)
- [ ] Strings pass through: '1rem' → '1rem'
- [ ] Mixed: padding(1, '2rem') → '0.25rem 2rem'
- [ ] Create scaleValue() helper
- [ ] Configurable scale factor (default 0.25)
