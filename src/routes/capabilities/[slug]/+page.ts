import { error } from '@sveltejs/kit';
import { isCapabilityId } from '$features/capabilities';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	if (!isCapabilityId(params.slug)) error(404, { message: 'unknown_route' });
	return { slug: params.slug };
};
