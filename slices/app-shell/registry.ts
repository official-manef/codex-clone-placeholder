import { DashboardScreen, dashboardFeature } from '$features/dashboard';
import { LiveDataScreen, liveDataFeature } from '$features/live-data';
import { SettingsScreen, settingsFeature } from '$features/settings';
import type { FeatureDefinition } from './types';

export const APP_REGISTRY = [
	{ ...dashboardFeature, screen: DashboardScreen },
	{ ...liveDataFeature, screen: LiveDataScreen },
	{ ...settingsFeature, screen: SettingsScreen }
] as const satisfies readonly FeatureDefinition[];

export type AppSlug = (typeof APP_REGISTRY)[number]['slug'];
export function getApp(slug: string) {
	return APP_REGISTRY.find((item) => item.slug === slug);
}
export function isAppSlug(slug: string): slug is AppSlug {
	return APP_REGISTRY.some((item) => item.slug === slug);
}
