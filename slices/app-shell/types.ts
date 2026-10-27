export type AreaId = 'workspace' | 'capabilities' | 'settings';
export type Destination = {
	id: string;
	labelKey: string;
	icon: string;
	area: AreaId;
	route: string;
};
export type Composition = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type OverlayId = 'command-palette' | 'context-summary' | 'composition-menu';
