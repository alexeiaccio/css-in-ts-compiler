import { _cv, cx } from "cssints";
import {
  bg,
  border,
  borderColor,
  borderRadius,
  boxShadow,
  cn,
  cv,
  flex,
  padding,
  fontSize,
  fontWeight,
  color,
  lineHeight,
  maxWidth,
} from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

const rootConfig = cv({
  base: cn(
    bg(t.color.surface()),
    borderRadius("0.5rem"),
    border("1px solid #e5e7eb"),
    boxShadow("0 1px 3px rgba(0,0,0,0.1)"),
  ),
  variants: {
    variant: {
      default: cn(bg(t.color.surface()), borderColor("#e5e7eb")),
      destructive: cn(bg(t.color.surface()), borderColor("#fca5a5")),
    },
    size: {
      sm: maxWidth("20rem"),
      md: maxWidth("28rem"),
      lg: maxWidth("32rem"),
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

const root = _cv(rootConfig);

const headerSlot = [padding("1.5rem 1.5rem 0"), flex().direction("column").gap("0.5rem")];
const titleSlot = [fontSize("1.25rem"), fontWeight("600"), color(t.color.text()), lineHeight("1.4")];
const descSlot = [fontSize("0.875rem"), color(t.color.muted()), lineHeight("1.5")];
const contentSlot = [padding("1.5rem"), color(t.color.text())];
const footerSlot = [padding("0 1.5rem 1.5rem"), flex().gap("0.75rem").justifyContent("flex-end")];

export type CardProps = {
  variant?: "default" | "destructive";
  size?: "sm" | "md" | "lg";
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Card({ variant, size, title, description, children, footer }: CardProps) {
  return (
    <div className={root({ variant: variant ?? "default", size: size ?? "md" })}>
      <div className={cx(...headerSlot)}>
        <h3 className={cx(...titleSlot)}>{title}</h3>
        {description && <p className={cx(...descSlot)}>{description}</p>}
      </div>
      <div className={cx(...contentSlot)}>{children}</div>
      {footer && <div className={cx(...footerSlot)}>{footer}</div>}
    </div>
  );
}
