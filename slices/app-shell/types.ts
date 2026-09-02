import type { Component } from 'svelte';
export type FeatureIcon = 'dashboard' | 'activity' | 'settings';
export type FeatureDefinition = {
	slug: string;
	label: string;
	description: string;
	icon: FeatureIcon;
	screen: Component;
};
