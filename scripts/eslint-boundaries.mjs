import path from 'node:path';

// Resolve aliases and relative paths so alternate spellings cannot bypass slice barrels.
/** @type {import('eslint').Rule.RuleModule} */
export const sliceBoundary = {
	meta: {
		type: 'problem',
		schema: [],
		messages: { barrel: 'Import another slice through $features/{{slice}}, not its internals.' }
	},
	create(context) {
		const root = path.resolve(import.meta.dirname, '..', 'slices');
		const filename = context.filename;
		const owner = path.relative(root, filename).split(path.sep)[0];
		/** @param {import('estree').ImportDeclaration | import('estree').ExportNamedDeclaration | import('estree').ExportAllDeclaration | import('estree').ImportExpression} node */
		function check(node) {
			const source = node.source;
			const value = source && 'value' in source ? source.value : undefined;
			if (typeof value !== 'string') return;
			const target = value.startsWith('$features/')
				? path.resolve(root, value.slice('$features/'.length))
				: value.startsWith('.')
					? path.resolve(path.dirname(filename), value)
					: undefined;
			if (!target) return;
			const relative = path.relative(root, target);
			if (relative.startsWith('..') || path.isAbsolute(relative)) return;
			const [slice, ...inside] = relative.split(path.sep);
			if (
				slice === owner ||
				inside.length === 0 ||
				/^index(?:\.[cm]?[jt]s)?$/.test(inside.join('/'))
			)
				return;
			context.report({ node, messageId: 'barrel', data: { slice } });
		}
		return {
			ImportDeclaration: check,
			ExportNamedDeclaration: check,
			ExportAllDeclaration: check,
			ImportExpression: check
		};
	}
};
