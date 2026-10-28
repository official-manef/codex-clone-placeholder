export function validPinnedSessions(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((id): id is string => typeof id === "string" && /^[a-f0-9]{32}$/.test(id)),
        ),
      ].slice(0, 100)
    : [];
}
export function togglePinnedSession(value: unknown, id: string): string[] {
  const current = validPinnedSessions(value);
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : validPinnedSessions([...current, id]);
}
export function isNearLatest(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
): boolean {
  return scrollHeight - scrollTop - clientHeight < 120;
}
