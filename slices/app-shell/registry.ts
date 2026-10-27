import type { Destination } from './types';

export const DESTINATIONS: readonly Destination[] = [
	{
		id: 'workspace',
		labelKey: 'rail_primary_destination',
		icon: 'message-square',
		area: 'workspace',
		route: '/workspace'
	},
	{
		id: 'capabilities',
		labelKey: 'rail_secondary_destination',
		icon: 'blocks',
		area: 'capabilities',
		route: '/capabilities'
	},
	{
		id: 'settings',
		labelKey: 'rail_tertiary_destination',
		icon: 'settings',
		area: 'settings',
		route: '/settings/configuration_category_01'
	}
];

export function getDestination(id: string): Destination | undefined {
	return DESTINATIONS.find((item) => item.id === id);
}

export function isDestinationId(id: string): boolean {
	return DESTINATIONS.some((item) => item.id === id);
}
