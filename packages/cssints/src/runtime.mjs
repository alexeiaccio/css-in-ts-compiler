// The only code that ships to the browser.
export const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");

export function _cv(config) {
  return (props = {}) => {
    const classes = [config.base];
    for (const [name, value] of Object.entries(props)) {
      const v = value || config.defaultVariants?.[name];
      if (v && config.variants[name]?.[v]) classes.push(config.variants[name][v]);
    }
    for (const [name, v] of Object.entries(config.defaultVariants ?? {})) if (!props[name] && config.variants[name]?.[v]) classes.push(config.variants[name][v]);
    return classes.filter(Boolean).join(" ");
  };
}
