/** Passive tabs identify the File objects explicitly granted by the user. */
export function openFileTab<T>(tabs: readonly T[], item: T): T[] {
  return tabs.includes(item) ? [...tabs] : [...tabs, item];
}

/** Closing an inactive tab never changes the selected file. */
export function closeFileTab<T>(
  tabs: readonly T[],
  selected: T | null,
  item: T,
): { tabs: T[]; selected: T | null } {
  const index = tabs.indexOf(item);
  if (index < 0) return { tabs: [...tabs], selected };
  const remaining = tabs.filter((_, i) => i !== index);
  return {
    tabs: remaining,
    selected: selected === item ? (remaining[index] ?? remaining[index - 1] ?? null) : selected,
  };
}
