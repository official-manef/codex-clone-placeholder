/** Pure token formatter. Validation and warning live in `index.ts`. */
export function tokenFor(key: string): string {
	return `{${key}}`;
}
