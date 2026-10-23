/**
 * The specs-workspace layout convention, as pure path arithmetic.
 *
 * A spec unit is one behavior-machine:
 *
 *     specs/<service>/<machine>.qnt
 *
 * generates:
 *
 *     src/<service>/<machine>.model.generated.json
 *     src/<service>/<machine>.scaffolding.generated.ts
 *
 * `shared/` holds importable vocabulary + pure defs only (no vars, actions or
 * state machines), so it is not itself generated.
 */

/** Split a relative path on either separator, so the mapping is portable. */
const segmentsOf = (relativePath: string): string[] => relativePath.split(/[\\/]/);

/** `specs/shared/*.qnt` is a shared module, not a generated spec. */
export const isSharedSpec = (specRelativePath: string): boolean =>
  /^specs[\\/]shared[\\/]/.test(specRelativePath);

/**
 * Map a spec path (relative to the workspace) to the model document path for
 * the generated artifact.
 */
export const specRelToOutRel = (specRelativePath: string): string => {
  const segments = segmentsOf(specRelativePath);
  const file = segments[segments.length - 1] ?? "";
  const service = segments[segments.length - 2] ?? "";
  const machine = file.replace(/\.qnt$/, "");
  return `src/${service}/${machine}.model.generated.json`;
};
