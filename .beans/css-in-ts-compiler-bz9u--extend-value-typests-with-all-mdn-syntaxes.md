---
# css-in-ts-compiler-bz9u
title: Extend value-types.ts with all MDN syntaxes
status: completed
type: task
priority: normal
created_at: 2026-02-18T10:17:29Z
updated_at: 2026-02-18T10:32:55Z
parent: css-in-ts-compiler-k8hb
---

- [x] Parse mdn-data/css/syntaxes.json
- [x] Add missing types: Time, Frequency, Resolution, Flex, Image
- [x] Add composite types: LengthPercentage, ColorPercentage
- [x] Update CSS_TYPE_MAP for new types



## Summary

Extended value-types.ts with 80+ new CSS types including:
- Layout: FlexDirection, JustifyContent, AlignItems, DisplayBox
- Typography: FontFamily, FontSize, FontWeight, TextAlign
- Border: BorderStyle, BorderWidth, BorderRadius
- Background: BackgroundColor, BackgroundImage, BackgroundRepeat
- Animation: EasingFunction, AnimationDirection, AnimationFillMode
- Filter: Blur, Brightness, Contrast, HueRotate, etc.
