# Design contract

The starter is a responsive application shell with a neutral visual baseline. A generated
product should express its own brand through the shared configuration and tokens while
keeping navigation, state feedback and keyboard behavior predictable.

## Sources and ownership

| Concern                                            | Edit here                                                |
| -------------------------------------------------- | -------------------------------------------------------- |
| Product name, description and public identity      | `src/lib/config/app.ts`                                  |
| Asset identity, paths and generation requirements  | `assets.config.ts`; [asset workflow](docs/assets.md)     |
| Colors, dimensions, radii and shell layout         | `src/routes/layout.css`                                  |
| Feature labels, icons, descriptions and navigation | `slices/app-shell/registry.ts` and each slice definition |
| Accessible base controls                           | `src/lib/components/ui/`                                 |
| Reusable app layout and interaction                | `src/lib/components/app-ui/`                             |
| Product screens and copy specific to a task        | `slices/<slug>/`                                         |

Do not create a parallel theme, asset URL list or menu array inside a screen. Keep
provider names and infrastructure details out of ordinary product flows unless they
help the user make a decision. Add a configuration field when it represents a shared
product choice; ordinary local labels do not all need to become global configuration.

## Existing visual baseline

Semantic tokens such as `--background`, `--foreground`, `--primary`, `--muted`,
`--destructive`, `--border` and `--ring` have light/dark definitions in `layout.css`.
Use their Tailwind utilities instead of local color literals. The current base radius
is `0.75rem`; control and layout radii derive from it. UI text uses the configured
sans-serif stack, with monospace reserved for code or technical values.

Shell dimensions also come from tokens: `--app-touch-target`, `--app-topbar-height`,
`--app-mobile-dock-height`, grid minimum widths and rail card width. Change these tokens
when changing the shared rhythm, rather than patching every consuming component.
Dark tokens exist; verify the selected product's theme behavior rather than assuming
a theme preference is already persisted.

## Layout and navigation

- One outer application shell owns header, desktop rail and mobile dock. Do not nest
  a second workspace shell inside a feature.
- Keep application surfaces full-width and `dvh` aware. A reading/form column may
  have a useful maximum width inside the shell.
- The shell owns one vertical scroll region, `[data-app-scroll]`. Keep fixed navigation
  outside it and reserve bottom/safe-area clearance so it cannot cover content.
- Breadcrumbs provide navigation context. The workspace switcher is a separate utility.
  The demo workspace selection is local UI state, not an authorization boundary.
- Use the same feature registry for navigation, route lookup and page metadata. Unknown
  slugs return a real not-found state; hidden navigation never substitutes for auth.
- Compose mobile content according to the task: list, rail, disclosure or adaptive grid.
  Do not shrink a desktop grid until labels or touch targets become unusable.

## Reuse the app primitives

| Primitive             | Contract                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `FeatureGrid`         | Content-aware `auto-fit/minmax`; choose density instead of fixed column counts.                         |
| `HorizontalRail`      | Peer content with horizontal scrolling and visible continuation; can become a grid.                     |
| `SegmentedControl`    | Native button group with `aria-pressed`; Tab/Enter/Space behavior, not fake tabs.                       |
| `SignalBanner`        | Important state or next action, not routine decorative text.                                            |
| `DisclosureCard`      | Secondary/setup content with native `details`/`summary` behavior.                                       |
| `ViewportSnapSection` | Proximity snapping only after measurement shows near-viewport content; never force short forms to snap. |

For true tab panels use an accessible tabs primitive with its complete keyboard and
panel relationships. Menus/dialogs must preserve focus, close with Escape where
appropriate and restore focus to their trigger. Prefer a native element when its
semantics fit; there is no blanket ban on `a`, `button`, `img` or form controls.

## States and accessibility

Each asynchronous task specifies loading, empty, success, failure and retry behavior.
Explain disabled features and required setup without implying that a selection enables
an integration. Keep errors near the affected field or action, announce relevant
updates, retain entered data on recoverable failure and prevent duplicate submission.

Provide a meaningful page title, one primary heading, labels, useful image alternatives,
visible keyboard focus and a sensible reading order. Decorative images use empty alt
text. Primary touch controls use the shared approximately 44px target. Check text and
interactive-state contrast against the product's accessibility target, including dark
mode, rather than relying on token names. Motion must respect reduced-motion preference
and must not be the only way to communicate state.

Keep document-level horizontal overflow at zero. Deliberate rails may scroll inside
their container. Verify long names, empty lists, errors, zoom and narrow screens; do
not rely on a screenshot containing only ideal demo data.

## Assets and interaction extensions

Use [the asset workflow](docs/assets.md) for favicon, app icons, social metadata images
and product imagery. Generate prompts from the shared identity/catalog, review the
result and then replace placeholders. Never put customer data or secrets in prompts.
Keep editable source artwork and useful image dimensions; avoid embedding essential
product copy into artwork where ordinary text is clearer.

Add drag-and-drop only for an actual spatial task. It needs a dedicated touch-sized
grip, pointer support, a keyboard equivalent, full destination targets, announcements,
server-authoritative persistence and rollback for failed optimistic updates. Ordinary
content must remain scrollable. These are acceptance requirements, not installed DnD
features.

## Design verification

Exercise the main task on desktop and narrow phone, then test keyboard-only use, menu
focus restoration and reduced motion. Review actual screenshots for clipping, hidden
actions and visual hierarchy. Record failing states in the product PRD and verify the
fix in the same viewport. Browser tests cover behavior; visual review covers what their
assertions cannot establish.
