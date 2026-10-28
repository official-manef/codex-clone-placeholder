import type { EffortOption } from "../types.js";

/** Ignore unavailable, invalid or duplicate options without inventing a value. */
export function selectableEffortOptions(options: readonly EffortOption[]): EffortOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (
      !option ||
      typeof option.value !== "string" ||
      !option.value.trim() ||
      typeof option.label !== "string" ||
      !option.label.trim() ||
      option.disabled ||
      seen.has(option.value)
    )
      return false;
    seen.add(option.value);
    return true;
  });
}

/** Unknown saved values remain unselected; they never silently become the first option. */
export function selectedEffortIndex(options: readonly EffortOption[], value: string): number {
  return options.findIndex((option) => option.value === value);
}
