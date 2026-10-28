/** Widths for a right-anchored file tree; reserve a usable document area. */
export const DEFAULT_FILE_TREE_WIDTH = 240;
export const MAX_FILE_TREE_WIDTH = 420;
const MIN_FILE_TREE_WIDTH = 120;
const MIN_DOCUMENT_WIDTH = 120;
const PREFERRED_DOCUMENT_WIDTH = 200;
const HANDLE_WIDTH = 8;

export function fileTreeBounds(containerWidth: number): { min: number; max: number } {
  const width = Number.isFinite(containerWidth) ? Math.max(0, containerWidth) : 0;
  const available = Math.max(0, width - MIN_DOCUMENT_WIDTH - HANDLE_WIDTH);
  const min = Math.min(MIN_FILE_TREE_WIDTH, available);
  const max = Math.max(
    min,
    Math.min(MAX_FILE_TREE_WIDTH, width - PREFERRED_DOCUMENT_WIDTH - HANDLE_WIDTH),
  );
  return { min, max };
}

export function visibleFileTreeWidth(preferred: number, containerWidth: number): number {
  const { min, max } = fileTreeBounds(containerWidth);
  const width = Number.isFinite(preferred) ? preferred : DEFAULT_FILE_TREE_WIDTH;
  return Math.max(min, Math.min(max, width));
}
