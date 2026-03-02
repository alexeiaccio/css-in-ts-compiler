export interface CSSStyleSheet {
  type: "stylesheet";
  children: CSSRule[];
}

export type CSSRule =
  | CSSStyleRule
  | CSSAtRule
  | CSSNestedStyleRule
  | CSSLayerRule
  | CSSContainerRule
  | CSSMediaRule
  | CSSSupportsRule
  | CSSKeyframesRule
  | CSSImportRule;

export interface CSSStyleRule {
  type: "style";
  selector: string;
  selectors?: string[];
  declarations: CSSDeclaration[];
  children?: CSSRule[];
}

export interface CSSAtRule {
  type: "at-rule";
  name: string;
  prelude?: string;
  block?: CSSBlock;
  children?: CSSRule[];
}

export interface CSSNestedStyleRule {
  type: "nested-style";
  selector: string;
  declarations: CSSDeclaration[];
  children?: CSSRule[];
}

export interface CSSLayerRule {
  type: "layer";
  name?: string;
  children: CSSRule[];
}

export interface CSSContainerRule {
  type: "container";
  prelude: string;
  children: CSSRule[];
}

export interface CSSMediaRule {
  type: "media";
  media: string;
  children: CSSRule[];
}

export interface CSSSupportsRule {
  type: "supports";
  condition: string;
  children: CSSRule[];
}

export interface CSSKeyframesRule {
  type: "keyframes";
  name: string;
  children: CSSKeyframeRule[];
}

export interface CSSKeyframeRule {
  type: "keyframe";
  selectors: string[];
  declarations: CSSDeclaration[];
}

export interface CSSImportRule {
  type: "import";
  url: string;
  media?: string;
}

export interface CSSBlock {
  type: "block";
  children: CSSBlockChild[];
}

export type CSSBlockChild = CSSDeclaration | CSSNestedStyleRule;

export interface CSSDeclaration {
  type: "declaration";
  property: string;
  value: string;
  important: boolean;
  bang?: boolean;
}

export interface CSSInvalidDeclaration {
  type: "invalid-declaration";
  raw: string;
}

export interface CSSComment {
  type: "comment";
  value: string;
}
