# Comprimage Design System

## Direction

Comprimage is a calm, precise image workbench expressed through an approachable
terminal-style visual language. The interface should disappear behind the
user’s image, make local processing obvious, and communicate quality without
turning into terminal parody or a professional editor.

- Product register: focused, trustworthy, technically capable, plain-spoken.
- Color strategy: warm near-black neutrals with one soft-green functional accent.
- Theme strategy: light and dark are equal; `system` is the default.
- Typography: self-hosted JetBrains Mono Variable throughout the product UI.
- Depth: surface contrast and quiet borders. Shadows are reserved for overlays.
- Imagery: user images are the primary visual material.

## Tokens

Semantic color tokens live in `src/styles.css`.

### Color roles

- `background`: `#fdfcfc` in light mode and `#171514` in dark mode.
- `foreground`: primary ink.
- `surface`: controls rails, preview chrome, and grouped settings; use subtle
  neutral shifts rather than floating cards.
- `surface-raised`: hover, selected, and overlay surfaces.
- `border`: quiet structural separators.
- `primary`: `#3f9465` in light mode and `#72d49a` in dark mode, reserved for
  active, focused, processing, successful, privacy, and primary-action states.
- `success`, `warning`, `destructive`, `info`: state-rich semantic colors.
- `muted-foreground`: supporting copy that still meets WCAG AA.

### Geometry and spacing

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px.
- Controls and panels: 2–6px radius, 1px borders, minimal or no shadow, and at
  least 40px desktop / 44px touch height.
- Pills: only for real status or compact segmented selection.
- Main content and workspace width: up to 1440px with compact responsive gutters.

### Type scale

- Page title: 32–40px, 700, line-height 1.1, commonly written as a `$` command.
- Section title: 22–26px, 650–700; utility sections use bracketed labels.
- Component title: 16–18px, 600.
- Body: 15–16px, line-height 1.55–1.7, max 70ch.
- UI label: 14px, 600.
- Caption/data: 12–14px; data may use monospace.

No serif display type, gradient text, or fluid marketing-sized headings.
Tracked uppercase is reserved for compact bracketed terminal labels.

## Components

- Header: compact 56px sticky bar with `[comprimage]`, primary tool navigation,
  a thin active-route underline, quiet About/Settings actions, and a
  three-segment theme switch (system/light/dark) that reuses the same active
  underline. Mobile uses a portalled dropdown menu; the theme switch stays in the
  bar at every width.
- Button: primary, secondary, outline, ghost, destructive, and icon variants;
  every variant has hover, focus, active, disabled, and loading treatment.
- Dropzone: a large dashed input surface with a visible browse action, file
  constraints, local-processing assurance, busy state, and inline error.
- Tool workspace: command intro, sticky 300–320px control rail, horizontal result
  summary, and one cohesive before/after preview with a draggable divider and
  synchronized zoom.
- Settings: open grouped rows separated by hairlines, not stacked cards. Holds
  configuration only — theme lives in the header, where it is one click away.
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
- Announce processing, completion, and errors with appropriate live
  regions without repeatedly interrupting users.
- Decorative images use empty alt text; user preview images describe their role.

## Do not use

- Atmospheric glows, decorative gradients, glassmorphism, background grids, CRT
  effects, scanlines, fake terminal chrome, or excessive command syntax.
- Serif product headings, marketing kickers, or oversized hero typography.
- Repeated icon-heading-copy card grids or nested cards.
- External font requests, telemetry, or any resource that weakens the local-only
  privacy promise.
- Arbitrary colors, radii, spacing, shadows, or z-index values outside tokens.
