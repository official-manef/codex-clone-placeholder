import { redirect } from '@sveltejs/kit';
import { FIRST_SECTION_ID } from '$features/settings-surface';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	redirect(307, `/settings/${FIRST_SECTION_ID}`);
};
