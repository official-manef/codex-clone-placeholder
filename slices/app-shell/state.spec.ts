import { describe, expect, it } from 'vitest';
import { createShellState, sidebarModeFor } from './state.svelte';

describe('shell state', () => {
	it('shows one overlay at a time', () => {
		const shell = createShellState('workspace');
		shell.openOverlay('command-palette');
		expect(shell.overlay).toBe('command-palette');
		shell.openOverlay('composition-menu');
		expect(shell.overlay).toBe('composition-menu');
	});

	it('closes an open overlay on area change', () => {
		const shell = createShellState('workspace');
		shell.openOverlay('command-palette');
		shell.setActiveArea('settings');
		expect(shell.activeArea).toBe('settings');
		expect(shell.overlay).toBeNull();
	});

	it('derives the sidebar mode from the viewport', () => {
		expect(sidebarModeFor(390, 'expanded')).toBe('drawer_open');
		expect(sidebarModeFor(768, 'expanded')).toBe('expanded');
	});

	it('closes an already closed overlay without changing anything', () => {
		const shell = createShellState('workspace');
		expect(shell.overlay).toBeNull();
		expect(shell.overlayTrigger).toBeNull();
		shell.closeOverlay();
		expect(shell.overlay).toBeNull();
		expect(shell.overlayTrigger).toBeNull();
		expect(shell.activeArea).toBe('workspace');
	});

	it('drops the recorded trigger once the overlay closes', () => {
		const shell = createShellState('workspace');
		shell.openOverlay('command-palette');
		shell.closeOverlay();
		expect(shell.overlay).toBeNull();
		expect(shell.overlayTrigger).toBeNull();
	});
});
