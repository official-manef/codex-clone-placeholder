import { error } from '@sveltejs/kit';
import { isAppSlug } from '$features/app-shell';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	if (!isAppSlug(params.slug)) error(404, 'App not found');
	return { slug: params.slug };
};
