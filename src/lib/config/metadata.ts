import { appConfig } from './app';
import { assets } from '../../../assets.config';

export function siteOrigin(value = '') {
	if (!value) return undefined;
	const url = new URL(value);
	if (
		!['https:', 'http:'].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.pathname !== '/' ||
		url.search ||
		url.hash
	) {
		throw new Error(
			'PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, path, query or fragment.'
		);
	}
	if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
		throw new Error('PUBLIC_SITE_URL must use HTTPS outside local development.');
	}
	return url.origin;
}

export function pageMetadata(meta: App.PageData['meta'], pathname: string, origin?: string) {
	return {
		title: meta?.title ? `${meta.title} · ${appConfig.name}` : appConfig.name,
		description: meta?.description ?? appConfig.description,
		// Never infer the canonical host from an incoming Host header.
		canonical: origin ? `${origin}${pathname}` : undefined,
		image: origin ? `${origin}${assets.socialImage.path}` : assets.socialImage.path
	};
}
