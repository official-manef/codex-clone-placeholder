import type { Destination } from './types';

// Destinations are added per composition as the shell slices land (plan steps 4-8).
export const DESTINATIONS: readonly Destination[] = [];

export function getDestination(id: string): Destination | undefined {
	return DESTINATIONS.find((item) => item.id === id);
}

export function isDestinationId(id: string): boolean {
	return DESTINATIONS.some((item) => item.id === id);
}
