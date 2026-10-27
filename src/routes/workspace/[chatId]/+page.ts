import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const CHAT_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const load: PageLoad = ({ params }) => {
	if (!CHAT_ID.test(params.chatId)) error(404, { message: 'unknown_route' });
	return { chatId: params.chatId };
};
