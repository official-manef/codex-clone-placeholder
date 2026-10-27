export { default as Workbench } from './components/workbench.svelte';
export { createWorkbenchState, clampSplitWidth, effectiveLayout, activeTab } from './state.svelte';
export type { CloseDecision, Tab, WorkbenchLayout } from './types';
