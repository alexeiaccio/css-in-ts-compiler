type Spec = string | readonly Spec[];
type V1<S> = S extends string ? string : S extends readonly unknown[] ? { -readonly [K in keyof S]: V1<S[K]> } : never;
type P1<S> = S extends readonly unknown[] ? V1<S> : [V1<S>];
declare function m1<const S extends Spec, E extends (...v: P1<S>) => object>(def: { args: S; emit: E }): S;
export const a = m1({ args: ["<color>", "<length>"], emit: (c, l) => ({ c, l }) });
// with infer P extends
type P2<S> = (S extends readonly unknown[] ? V1<S> : [V1<S>]) extends infer P extends unknown[] ? P : never;
declare function m2<const S extends Spec, E extends (...v: P2<S>) => object>(def: { args: S; emit: E }): S;
export const b = m2({ args: ["<color>", "<length>"], emit: (c, l) => ({ c, l }) });
// union with object
declare function m3<const S extends Spec, const E extends object | ((...v: P1<S>) => object)>(def: { args: S; emit: E }): S;
export const c = m3({ args: ["<color>", "<length>"], emit: (c, l) => ({ c, l }) });
declare function m4<const S extends Spec, const E extends object | ((...v: P2<S>) => object)>(def: { args: S; emit: E }): S;
export const d = m4({ args: ["<color>", "<length>"], emit: (c, l) => ({ c, l }) });
declare function m5<const S extends Spec | undefined = undefined, const E extends object | ((...v: P2<S>) => object) = object>(def: { args?: S; emit: E }): S;
export const e = m5({ args: ["<color>", "<length>"], emit: (c, l) => ({ c, l }) });
