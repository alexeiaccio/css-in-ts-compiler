declare const __type: unique symbol;

type Type<__Type> = { [__type]: __Type };

export type Typed<T, __Type> = T & Type<__Type>;

export function createTyped<T, __Type>(value: T): Typed<T, __Type> {
	return value as Typed<T, __Type>;
}

const identity = <T>(value: unknown): T => value as T;

// Units
// Length
// Font
export type Cap = `${number}cap`;
export type Ch = `${number}ch`;
export type Em = `${number}em`;
export type Ex = `${number}ex`;
export type Ic = `${number}ic`;
export type Lh = `${number}lh`;
// Root
export type Rcap = `${number}rcap`;
export type Rch = `${number}rch`;
export type Rem = `${number}rem`;
export type Rex = `${number}rex`;
export type Rlh = `${number}rlh`;
// Viewport
export type Vh = `${number}vh`;
export type Vw = `${number}vw`;
export type Vmax = `${number}vmax`;
export type Vmin = `${number}vmin`;
export type Vb = `${number}vb`;
export type Vi = `${number}vi`;
// ... and new ones
export type Dvw = `${number}dvw`;

// Container
export type Cqw = `${number}cqw`;
export type Cqh = `${number}cqh`;
export type Cqi = `${number}cqi`;
export type Cqb = `${number}cqb`;
export type Cqmin = `${number}cqmin`;
export type Cqmax = `${number}cqmax`;
// Absolute
export type Px = `${number}px`;
export type Cm = `${number}cm`;
export type Mm = `${number}mm`;
export type Q = `${number}Q`;
export type In = `${number}in`;
export type Pc = `${number}pc`;
export type Pt = `${number}pt`;

// Angle
export type Deg = `${number}deg`;
export type Rad = `${number}rad`;
export type Grad = `${number}grad`;
export type Turn = `${number}turn`;

// Types
export type Angle = Number | Deg | Rad | Grad | Turn;
export type Length =
	| Number
	| Cap
	| Ch
	| Em
	| Ex
	| Ic
	| Lh
	| Rcap
	| Rch
	| Rem
	| Rex
	| Rlh
	| Vh
	| Vw
	| Vmax
	| Vmin
	| Vb
	| Vi
	| Cqw
	| Cqh
	| Cqi
	| Cqb
	| Cqmin
	| Cqmax
	| Px
	| Cm
	| Mm
	| Q
	| In
	| Pc
	| Pt;
export type None = "none";
export type Number = number;
export type Zero = 0 | "0";

// Units
export const number = createTyped<(value: number) => Number, "NumberFn">(identity);
export const deg = createTyped<(value: number) => Deg, "DegFn">((value) => `${value}deg`);
export const rad = createTyped<(value: number) => Rad, "RadFn">((value) => `${value}rad`);
export const grad = createTyped<(value: number) => Grad, "GradFn">((value) => `${value}grad`);
export const turn = createTyped<(value: number) => Turn, "TurnFn">((value) => `${value}turn`);

// Types
export const zero = createTyped<(value: 0) => Zero, "ZeroFn">(identity);
export const angle = createTyped<(value: Number | Deg | Rad | Grad | Turn) => Angle, "AngleFn">(identity);

// Functions
export type Blur = Typed<string, "Blur">;
export const blur = createTyped<(value?: Length) => Blur, "BlurFn">((value) => `blur(${value})` as Blur);
export type HueRotate = Typed<string, "HueRotate">;
export const hueRotate = createTyped<(angle?: Angle | Zero) => HueRotate, "HueRotateFn">(
	(angle?: Angle | Zero) => `hue-rotate(${angle})` as HueRotate,
);

export type Url = Typed<string, "Url">;
export type FilterFunction = Blur | HueRotate;
// | Brightness
// | Contrast
// | DropShadow
// | Grayscale
// | Invert
// | Opacity
// | Saturate
// | Sepia;
export type FilterValueList = FilterFunction | Url;

// Properties
export type Filter = Typed<string, "Filter">;
/**
 * The **`filter`** CSS property applies graphical effects like blur or color shift to an element. Filters are commonly used to adjust the rendering of images, backgrounds, and borders.
 *
 * **Syntax**: `none | <filter-value-list>`
 *
 * **Initial value**: `none`
 *
 * This feature is well established and works across many devices and browser versions. It’s been available across browsers since September 2016.
 *
 * |  Chrome  | Firefox | Safari  |
 * | :------: | :-----: | :-----: |
 * |  **53**  | **35**  | **9.1** |
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/filter
 */
export const filter = createTyped<(...value: FilterValueList[] | [None]) => Filter, "FilterFn">(
	(...value) => value.join(" ") as Filter,
);

// JSX CSS Properties
export type CSSProperties = {
	/**
	 * The **`filter`** CSS property applies graphical effects like blur or color shift to an element. Filters are commonly used to adjust the rendering of images, backgrounds, and borders.
	 *
	 * **Syntax**: `none | <filter-value-list>`
	 *
	 * **Initial value**: `none`
	 *
	 * This feature is well established and works across many devices and browser versions. It’s been available across browsers since September 2016.
	 *
	 * |  Chrome  | Firefox | Safari  |
	 * | :------: | :-----: | :-----: |
	 * |  **53**  | **35**  | **9.1** |
	 *
	 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/filter
	 */
	filter?: Filter;
	// ...
	minHeight?: Length;
};

// Constructors
export type Style = Typed<object, "JSXStyle">;
export const style = createTyped<(value?: CSSProperties) => Style, "StyleFn">(identity);

// Examples
export const example1 = hueRotate(deg(10));
export const example2 = hueRotate("3rad");
// @ts-expect-error
export const wrong = hueRotate("60px"); // → Argument of type '"60px"' is not assignable to parameter of type 'number | `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn` | "0" | undefined'.ts(2345)
export const example3 = filter(hueRotate("0"));
export const example4 = filter(blur("100px"), hueRotate("0"));
export const example5 = style({
	filter: filter(blur("100px"), hueRotate("0")),
	minHeight: 100,
});
export const example6 = style({
	// @ts-expect-error
	filter: filter(blur("100px"), hueRotate("0"), rad(10)), // → Argument of type '`${number}rad`' is not assignable to parameter of type 'FilterValueList'.ts(2345)
	// @ts-expect-error
	wrong: "100px", // → Object literal may only specify known properties, and 'wrong' does not exist in type 'CSSProperties'.ts(2353)
});
