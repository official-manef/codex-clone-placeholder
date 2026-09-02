# Svelte UI/UX kit contract

This starter treats layout and interaction as reusable product primitives, not per-page breakpoint patches.

## Shared primitives

All reusable app-first primitives live in `src/lib/components/app-ui/`:

- `FeatureGrid` — content-aware `auto-fit/minmax` composition. Pick a minimum useful card density; CSS decides whether 1, 2, 3, or more columns fit.
- `HorizontalRail` — mobile horizontal rail with mandatory snap and partial-card continuation; optionally becomes an adaptive grid on larger canvases.
- `SegmentedControl` — local peer modes with `$bindable` state; it overflows and snaps instead of shrinking labels until they become unreadable.
- `SignalBanner` — exceptional cross-cutting state or one important next action; not decoration.
- `DisclosureCard` — secondary/setup-heavy/advanced content using native `<details>` semantics.
- `ViewportSnapSection` — measures itself against the real app scroll owner with `ResizeObserver`; only sections at least ~88% of the content viewport become vertical proximity snap targets.

## Shell rules

- Breadcrumb is semantic context only: `workspace → feature`. Do not put a dropdown, select, or action inside the breadcrumb `<nav>`.
- Workspace switching is a separate utility control.
- The app owns one vertical scroll region (`[data-app-scroll]`). Header/sidebar/dock stay outside it.
- Mobile/tablet stay app-first below `lg`; the desktop rail starts at `lg`.
- Mobile dock is registry-driven and horizontally scrollable when the registry grows; never hardcode `grid-cols-N` from the current app count.
- Feature explanations live inside feature content instead of permanently increasing header height.

## Responsive composition

Use this decision order:

1. summary / context;
2. attention / signal;
3. primary task;
4. peer views (tabs/segmented control);
5. secondary setup (disclosure);
6. advanced/destructive controls.

A desktop grid should not automatically become a squeezed mobile grid. Prefer a rail, list, agenda, tabs, or disclosure according to the task.

## Spatial interaction

Do not add a drag-and-drop dependency globally just because the kit supports spatial UI. When a feature genuinely needs DnD:

- use a dedicated ~44px drag grip with `touch-action: none` so ordinary card/content areas can still scroll;
- provide pointer semantics that work for mouse, touch, and stylus;
- provide a keyboard equivalent and visible focus;
- keep the server mutation authoritative and use optimistic UI only as feedback;
- make the whole destination region droppable rather than relying on tiny empty-state targets;
- announce successful/failed moves for assistive technology.

## Svelte 5 rule

Runes are mandatory for new app code. `$effect` is reserved for synchronization with external systems such as `ResizeObserver`; do not use it to mirror state that can be `$derived` or updated directly in an event handler.
