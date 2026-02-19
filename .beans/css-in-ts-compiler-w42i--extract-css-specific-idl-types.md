---
# css-in-ts-compiler-w42i
title: Extract CSS-Specific IDL Types
status: todo
type: task
priority: high
created_at: 2026-02-19T08:02:18Z
updated_at: 2026-02-19T08:03:00Z
parent: css-in-ts-compiler-864t
blocked_by:
    - css-in-ts-compiler-vmi4
---

Create scripts/extract-css-idl.ts to filter IDL types relevant to CSS

## CSS-Relevant Interfaces to Extract
- CSSStyleValue, CSSNumericValue, CSSUnitValue, CSSKeywordValue
- CSSMathValue, CSSMathSum, CSSMathProduct, CSSMathMin, CSSMathMax
- CSSTransformValue, CSSTransformComponent, CSSRotate, CSSScale, CSSSkew, CSSTranslate
- CSSColorValue, CSSHexColor, CSSRGBColor, CSSHSLColor
- CSSPerspective, CSSMatrixComponent, CSSImageValue, CSSPositionValue
- StylePropertyMap, StylePropertyMapReadOnly

## Output
Returns filtered Map<string, IDLType> containing only CSS-related types.
