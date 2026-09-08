import { error } from '@sveltejs/kit';
import { getApp } from '$features/app-shell';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const app = getApp(params.slug);
	if (!app) error(404, 'App not found');
	return {
		slug: app.slug,
		meta: { title: app.label, description: app.description, indexable: false }
	};
};
