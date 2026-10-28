/** Descriptive UI metadata only; registering a feature never grants authority. */
export type FeatureDescriptor<Screen = unknown> = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly group?: string;
  /** Semantic navigation role; independent of the displayed group label. */
  readonly navigationRole?: "settings" | "explore";
  readonly placement?: string;
  readonly defaultEnabled?: boolean;
  readonly loadScreen?: () => Promise<{ default: Screen }>;
};

export type FeatureRegistryOptions<T extends FeatureDescriptor> = {
  readonly features: readonly T[];
  /** When provided, only these features and required IDs are enabled. */
  readonly enabledIds?: readonly string[];
  /** Required IDs cannot be disabled by the selection. */
  readonly requiredIds?: readonly string[];
};

export type FeatureScreen<T extends FeatureDescriptor> =
  NonNullable<T["loadScreen"]> extends () => Promise<{
    default: infer Screen;
  }>
    ? Screen
    : never;

/**
 * A validated immutable snapshot. Recreate it when product configuration changes;
 * selection and lookup never trigger a feature loader or action.
 */
export function createFeatureRegistry<T extends FeatureDescriptor>(
  options: FeatureRegistryOptions<T>,
) {
  const byId = new Map<string, Readonly<T>>();
  const ordered: Readonly<T>[] = [];
  for (const item of options.features) {
    if (!item || typeof item.id !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(item.id))
      throw new Error("Invalid feature ID");
    if (byId.has(item.id)) throw new Error(`Duplicate feature ID: ${item.id}`);
    if (
      typeof item.label !== "string" ||
      !item.label.trim() ||
      typeof item.icon !== "string" ||
      !item.icon.trim()
    )
      throw new Error(`Feature ${item.id} needs a label and icon`);
    if (item.loadScreen !== undefined && typeof item.loadScreen !== "function")
      throw new Error(`Feature ${item.id} has an invalid screen loader`);
    const copy = Object.freeze({ ...item }) as Readonly<T>;
    byId.set(item.id, copy);
    ordered.push(copy);
  }
  const required = new Set(options.requiredIds ?? []);
  const selected = options.enabledIds === undefined ? null : new Set(options.enabledIds);
  for (const id of [...required, ...(selected ?? [])]) {
    if (!byId.has(id)) throw new Error(`Unknown configured feature: ${id}`);
  }
  const active = ordered.filter(
    (item) =>
      required.has(item.id) || (selected ? selected.has(item.id) : item.defaultEnabled !== false),
  );
  const enabledById = new Map(active.map((item) => [item.id, item]));
  const features = Object.freeze(active);

  function get(id: string): Readonly<T> | undefined {
    return enabledById.get(id);
  }
  function select(ids: readonly string[]): Readonly<T>[] {
    return [...new Set(ids)].flatMap((id) => {
      const entry = get(id);
      return entry ? [entry] : [];
    });
  }
  async function loadScreen(id: string): Promise<FeatureScreen<T>> {
    const item = get(id);
    if (!item || !item.loadScreen) throw new Error(`Feature screen unavailable: ${id}`);
    const module = await item.loadScreen();
    if (!module || module.default == null) throw new Error(`Feature screen unavailable: ${id}`);
    return module.default as FeatureScreen<T>;
  }
  return Object.freeze({
    features,
    get,
    select,
    hasScreen: (id: string) => !!get(id)?.loadScreen,
    loadScreen,
  });
}
