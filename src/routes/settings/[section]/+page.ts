import { error } from '@sveltejs/kit';
import { isSectionId } from '$features/settings-surface';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	if (!isSectionId(params.section)) error(404, { message: 'unknown_route' });
	return { section: params.section };
};
