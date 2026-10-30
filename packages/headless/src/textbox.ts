import { type Field, type FieldOptions, createField } from "./field";

/** The HTML `autocomplete` tokens worth naming; the attribute also takes an arbitrary token. */
export type AutoCompleteToken =
  | "off"
  | "on"
  | "name"
  | "given-name"
  | "family-name"
  | "username"
  | "email"
  | "tel"
  | "url"
  | "organization"
  | "street-address"
  | "postal-code"
  | "current-password"
  | "new-password"
  | "one-time-code"
  | "nickname";

export interface TextInputOptions extends FieldOptions {
  readonly type?: "text" | "email" | "tel" | "url" | "search" | "password";
  /** The HTML token list: the browser's own autofill is the accessible path. */
  readonly autoComplete?: AutoCompleteToken | undefined;
  readonly spellCheck?: boolean | undefined;
  readonly autoCapitalize?: "none" | "sentences" | "words" | "characters" | undefined;
  readonly inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search"
    | undefined;
  readonly maxLength?: number | undefined;
  readonly readOnly?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly name?: string | undefined;
  readonly dir?: "ltr" | "rtl" | "auto" | undefined;
  readonly placeholder?: string | undefined;
  /** Change and input both land here; the host decides what a keystroke means. */
  readonly onValueChange?: ((value: string) => void) | undefined;
}

export interface TextAreaOptions extends TextInputOptions {
  readonly rows?: number | undefined;
  readonly wrap?: "soft" | "hard" | "off" | undefined;
  readonly resize?: "none" | "vertical" | "horizontal" | "both" | undefined;
}

export interface TextControlProps {
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": "true" | undefined;
  readonly "aria-required": "true" | undefined;
  readonly required: true | undefined;
  readonly type: TextInputOptions["type"];
  readonly autoComplete: AutoCompleteToken | undefined;
  readonly spellcheck: "true" | "false" | undefined;
  readonly autocapitalize: TextInputOptions["autoCapitalize"];
  readonly inputmode: TextInputOptions["inputMode"];
  readonly maxlength: number | undefined;
  readonly readOnly: true | undefined;
  readonly disabled: true | undefined;
  readonly name: string | undefined;
  readonly dir: "ltr" | "rtl" | "auto" | undefined;
  readonly placeholder: string | undefined;
  readonly onInput: (event: { currentTarget: { value: string } }) => void;
}

export interface TextAreaControlProps extends TextControlProps {
  readonly rows: number | undefined;
  readonly wrap: TextAreaOptions["wrap"];
  readonly style: { readonly resize: "none" | "vertical" | "horizontal" | "both" } | undefined;
}

/** The field and the control, one object: every prop the element needs. */
export interface TextInput extends Field {
  readonly controlProps: TextControlProps;
}

export interface TextArea extends Field {
  readonly controlProps: TextAreaControlProps;
}

const control = (field: Field, options: TextInputOptions): TextControlProps => ({
  ...field.controlProps,
  get type() {
    return options.type ?? "text";
  },
  get autoComplete() {
    return options.autoComplete;
  },
  get spellcheck() {
    if (options.spellCheck === undefined) {
      return undefined;
    }
    return options.spellCheck ? "true" : "false";
  },
  get autocapitalize() {
    return options.autoCapitalize;
  },
  get inputmode() {
    return options.inputMode;
  },
  get maxlength() {
    return options.maxLength;
  },
  get readOnly() {
    return options.readOnly === true ? true : undefined;
  },
  get disabled() {
    return options.disabled === true ? true : undefined;
  },
  get name() {
    return options.name;
  },
  get dir() {
    return options.dir;
  },
  get placeholder() {
    return options.placeholder;
  },
  onInput: (event) => {
    options.onValueChange?.(event.currentTarget.value);
  },
});

/**
 * A text input with the field contract attached: label, hint, error (announced),
 * `aria-describedby` and `aria-invalid` come from `createField`; this adds the
 * props a host forgets — autofill tokens, spellcheck, inputmode, maxlength, the
 * disabled/readOnly pair. Platform: native (`input` is its own APG-equivalent;
 * no primitive re-implements text editing, which is why there is no key
 * handling here).
 *
 * Both `required` and `aria-required` are emitted: the native attribute is what
 * the browser enforces, the ARIA one is what a custom widget reading the same
 * props needs. A host that validates itself passes `noValidate` on the form
 * rather than dropping the attribute.
 */
export const createTextInput = (options: TextInputOptions = {}): TextInput => {
  const field = createField(options);
  return { ...field, controlProps: control(field, options) };
};

/**
 * The same contract for a textarea, plus rows, wrap and resize. `resize` is a
 * style because CSS has no attribute for it; `none` is the value a layout that
 * owns its own height wants.
 */
export const createTextArea = (options: TextAreaOptions = {}): TextArea => {
  const field = createField(options);
  return {
    ...field,
    controlProps: {
      ...control(field, options),
      get rows() {
        return options.rows;
      },
      get wrap() {
        return options.wrap;
      },
      get style() {
        return options.resize === undefined ? undefined : { resize: options.resize };
      },
    },
  };
};
