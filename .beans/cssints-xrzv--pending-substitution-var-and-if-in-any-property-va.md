---
# cssints-xrzv
title: 'Pending substitution: var() and if() in any property value'
status: draft
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-29T16:57:52Z
updated_at: 2026-09-29T16:57:52Z
parent: cssints-vy0o
---

## Question

After cssints-gcuz, `var()` and `if()` are accepted only in `<color>`. CSS allows them in any property value: the value is then "pending substitution" and valid at parse time. Should the twin and the types accept `var()`/`if()` anywhere, and still check the rest of the value (stricter than Chrome), or treat such a value as unchecked? This interacts with tokens, which are already checked by substituting a literal of their type.
