# UI/UX guide

[DESIGN.md](DESIGN.md) is the starter's canonical visual and interaction contract.
[ui-spec.md](docs/ui-spec.md) is the product-specific contract for this repository: region
hierarchy, six compositions, `--shell-*` tokens, responsive ranges, controls inventory,
focus/keyboard contract and the required feedback states.

Implementation lives in `src/lib/components/app-ui/`, `src/routes/layout.css` and the root
slices. The registry in `slices/app-shell/registry.ts` owns destinations and navigation.

Product copy is intentionally absent. Every visible string resolves through
`slices/placeholders` — see [placeholder-copy.md](docs/placeholder-copy.md). Do not
replace tokens with invented language; that is a product decision tracked in
[PRD.md](docs/PRD.md).
