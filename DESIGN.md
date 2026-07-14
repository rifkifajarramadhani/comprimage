# Comprimage Design System

## Direction

Comprimage is a calm, precise image workbench. The interface should disappear
behind the user’s image, make local processing obvious, and communicate quality
without looking like a marketing site or a professional editor.

- Product register: focused, trustworthy, technically capable, plain-spoken.
- Color strategy: restrained cool neutrals with one blue-violet action accent.
- Theme strategy: light and dark are equal; `system` is the default.
- Typography: one system sans family for all product UI and a system monospace
  stack for dimensions, sizes, and codec values.
- Depth: surface contrast and quiet borders. Shadows are reserved for overlays.
- Imagery: user images are the primary visual material.

## Tokens

All color tokens use OKLCH in `src/styles.css`.

### Color roles

- `background`: app canvas; true white in light mode, deep navy-black in dark.
- `foreground`: primary ink.
- `surface`: controls rails, preview chrome, grouped settings.
- `surface-raised`: hover, selected, and overlay surfaces.
- `border`: quiet structural separators.
- `primary`: blue-violet, reserved for primary actions and current selection.
- `success`, `warning`, `destructive`, `info`: state-rich semantic colors.
- `muted-foreground`: supporting copy that still meets WCAG AA.

### Geometry and spacing

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px.
- Controls: 8px radius and at least 40px desktop / 44px touch height.
- Panels and preview frames: 12px radius.
- Pills: only for real status or compact segmented selection.
- Main content width: 1200px; workspace width: 1320px.

### Type scale

- Page title: 32–40px, 700, line-height 1.1.
- Section title: 22–26px, 650–700.
- Component title: 16–18px, 600.
- Body: 15–16px, line-height 1.55–1.7, max 70ch.
- UI label: 14px, 600.
- Caption/data: 12–14px; data may use monospace.

No serif display type, gradient text, uppercase tracked kickers, or fluid
marketing-sized headings.

## Components

- Header: 64px sticky bar with wordmark, primary tool navigation, and quiet
  About/Settings actions. Mobile uses a portalled dropdown menu.
- Button: primary, secondary, outline, ghost, destructive, and icon variants;
  every variant has hover, focus, active, disabled, and loading treatment.
- Dropzone: a large dashed input surface with a visible browse action, file
  constraints, local-processing assurance, busy state, and inline error.
- Tool workspace: compact page intro, sticky 320px control rail, horizontal
  result summary, and one cohesive before/after preview region.
- Settings: open grouped rows separated by hairlines, not stacked cards.
- Batch: controls rail plus queue list; aggregate progress and download remain
  visible while results exist.
- Feedback: skeletons for processing, icon plus text for semantic state, and
  status messages announced to assistive technology.

## Motion and layering

- Fast: 150ms; standard: 180ms; deliberate: 220ms.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Animate opacity, transform, background, border, and shadow only.
- `prefers-reduced-motion: reduce` disables nonessential animation.
- Z-index: sticky 20, dropdown 40, update/toast 60, tooltip 70.

## Responsive behavior

- Below 1024px: workspaces stack; controls are no longer sticky.
- Below 768px: desktop navigation collapses; page padding is 20px; previews and
  result summaries stack; all interactive targets are at least 44px.
- Below 480px: settings rows may stack when labels and controls cannot coexist.
- Long filenames truncate visually while preserving the full accessible name.
- No horizontal page scrolling at any supported width.

## Accessibility

- Target WCAG 2.2 AA.
- Never rely on color alone for success, warning, or error.
- Use visible `:focus-visible` rings with at least 3:1 contrast.
- Preserve logical DOM and keyboard order when layouts reflow.
- Announce processing, completion, errors, and PWA updates with appropriate live
  regions without repeatedly interrupting users.
- Decorative images use empty alt text; user preview images describe their role.

## Do not use

- Atmospheric glows, decorative gradients, glassmorphism, or background grids.
- Serif product headings, marketing kickers, or oversized hero typography.
- Repeated icon-heading-copy card grids or nested cards.
- External font requests, telemetry, or any resource that weakens the local-only
  privacy promise.
- Arbitrary colors, radii, spacing, shadows, or z-index values outside tokens.
