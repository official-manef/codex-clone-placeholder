import { describe, expect, it } from 'vitest';
import { createDraftStore } from '../draft.svelte';

function fakeStorage(): Storage & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		get length() {
			return data.size;
		},
		clear() {
			data.clear();
		},
		getItem: (key: string) => data.get(key) ?? null,
		key: (index: number) => [...data.keys()][index] ?? null,
		removeItem: (key: string) => {
			data.delete(key);
		},
		setItem: (key: string, value: string) => {
			data.set(key, value);
		}
	};
}

describe('createDraftStore', () => {
	it('isolates drafts per key (AC07)', () => {
		const store = createDraftStore(fakeStorage());
		store.setValue('a', 'x');
		store.setValue('b', 'y');
		expect(store.get('a')).toBe('x');
		expect(store.get('b')).toBe('y');
		store.setValue('a', 'x2');
		store.setValue('b', 'y2');
		expect(store.get('a')).toBe('x2');
		expect(store.get('b')).toBe('y2');
	});

	it('clears only the requested key', () => {
		const store = createDraftStore(fakeStorage());
		store.setValue('a', 'x');
		store.setValue('b', 'y');
		store.clear('a');
		expect(store.get('a')).toBe('');
		expect(store.get('b')).toBe('y');
	});

	it('returns an empty string for an unknown key', () => {
		expect(createDraftStore(fakeStorage()).get('never-written')).toBe('');
		expect(createDraftStore(null).get('never-written')).toBe('');
	});

	it('survives a storage that throws (private mode)', () => {
		const hostile = {
			getItem() {
				throw new Error('denied');
			},
			setItem() {
				throw new Error('denied');
			},
			removeItem() {
				throw new Error('denied');
			}
		} as unknown as Storage;
		const store = createDraftStore(hostile);
		expect(() => store.setValue('a', 'x')).not.toThrow();
		expect(store.get('a')).toBe('x');
		expect(() => store.clear('a')).not.toThrow();
		expect(store.get('a')).toBe('');
	});

	it('reads a value written by a previous session from storage', () => {
		const storage = fakeStorage();
		storage.setItem('draft:a', 'restored');
		expect(createDraftStore(storage).get('a')).toBe('restored');
	});
});
