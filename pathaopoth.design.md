---
version: 1.0
name: PathaoPoth
surface: pathaopoth-web
description: A dense, status-first operations console for parcel exception handling. The system anchors on a cool near-neutral canvas with white data surfaces, a deep route-blue reserved exclusively for navigation and primary action, and a six-channel status ramp that carries every piece of operational meaning. Brand voltage is deliberately low — in a queue console, colour is a data channel, not decoration. Type voice is a single grotesque (Inter) at 14px base with tabular numerals for money and monospace for identifiers, plus a Bengali fallback face for the Bangla locale. AI-proposed content carries its own violet provenance channel so machine suggestions are never mistaken for human decisions.

spec:
  title: "PathaoPoth Design System — ops console tokens, 94 component entries, light + dark"
  summary: "The design language for pathaopoth-web: an exception-handling console used by hub staff, riders, care agents, and ops managers. Covers colour, type, density, motion, layering, interaction states, and a component inventory marked built vs proposed."
  highlights:
    - "Status is the colour language — the six-channel ramp (queued, transit, attention, breach, settled, AI) owns meaning; the brand blue never competes with it"
    - "14px body, not 16px — this is a data tool read for eight hours, not a page scrolled once"
    - "Three densities: comfortable (52px rows), compact (40px rows), and field mode (64px rows, 56px targets) for riders on a phone outdoors"
    - "Violet provenance channel marks everything the AI proposed but no human has confirmed — the single most load-bearing distinction in the product"
    - "Every interactive element documents six states: default, hover, focus-visible, active, disabled, loading — the opposite of a marketing system"
    - "Dark theme is a first-class second palette with its own elevation ladder, not an inversion"
  audiences:
    - "Hub staff — desk, counter, scanner, keyboard-heavy, high volume"
    - "Riders — phone, one-handed, outdoors, gloves, poor signal"
    - "Care agents — desk, triage queues, reads case history all day"
    - "Ops managers — dashboards, reporting, low frequency"
  locales: ["en", "bn"]
  currency: "BDT"
  timezone: "Asia/Dhaka"
  lastUpdated: "2026-09-15"
  decisions:
    - id: "why-not-branded"
      title: "Why is the brand colour used so sparingly?"
      answer: "Because every colour an operator sees has to mean something. In a queue console the reader is scanning for state — is this case breaching SLA, is it in transit, has the AI touched it — and any colour spent on decoration is a colour they have to learn to ignore. Route blue #124191 is reserved for exactly three jobs: navigation position, primary action, and selection. It never appears as a status, never fills a card, never tints a chart series that is not itself about the brand. Visual interest comes from density, alignment, and typographic hierarchy, not from brand expression."
    - id: "status-channel"
      title: "What is the status channel and why six?"
      answer: "Six operational states the reader must separate at a glance: queued (neutral slate), transit (cyan), attention (amber), breach (red), settled (green), and AI-proposed (violet). Each has a soft background, a text foreground, and a solid variant. Nothing outside this ramp may use these hues. The ramp maps onto ExceptionCase.status and the SLA clock, so a reader learns six colours once and can then read every queue in the product."
    - id: "ai-provenance"
      title: "Why does AI content get its own colour?"
      answer: "AiAnalysis proposes an action, a destination, and a schedule; CaseDecision records what a human actually confirmed. Confusing the two is the most expensive mistake available in this product — it means a parcel moved because nobody checked. Violet marks proposed-and-unconfirmed, and the violet disappears the moment a human confirms. Human-confirmed content is the unmarked default: plain ink on plain surface."
    - id: "density"
      title: "Why three densities instead of one?"
      answer: "A hub operator at a counter wants forty rows on screen; a rider in the rain wants four targets they can hit without looking. Comfortable (52px rows) is the default, compact (40px) is a persisted user preference, and field mode (64px rows, 56px touch targets, 16px body) is selected by role and viewport together, never by viewport alone — a care agent on a tablet still gets the desk console."
    - id: "hover-states"
      title: "Why document hover when the source format says never to?"
      answer: "The format this file borrows describes a marketing site, where a visitor scrolls once and hover is a garnish. This is an application. Hover, focus-visible, active, disabled, and loading are where the usability lives: they are how an operator knows a row is clickable, which control holds the keyboard, and whether a submit already fired. Every interactive component here documents all six states, and the Interaction States section is normative."
    - id: "bengali"
      title: "What changes in the Bangla locale?"
      answer: "Inter has no Bengali coverage, so the stack falls through to Noto Sans Bengali per glyph. Bengali needs roughly 0.15 more line-height for matras and descenders, never takes negative letter-spacing, and is never uppercased — so the overline style drops its text-transform in bn. Strings run 20-30% longer than English, so no label may sit in a fixed-width box. Tracking numbers stay Latin always, in every locale."

colors:
  brand: "#124191"
  brand-hover: "#0e3576"
  brand-pressed: "#0a2a5c"
  brand-soft: "#e8eefb"
  brand-border: "#b9cdf2"
  brand-text: "#1a4fa8"
  on-brand: "#ffffff"

  canvas: "#f4f6f9"
  surface: "#ffffff"
  surface-sunken: "#eef1f6"
  surface-raised: "#ffffff"
  surface-hover: "#f6f8fb"
  surface-selected: "#e8eefb"
  hairline: "#e1e6ee"
  hairline-strong: "#c9d2e0"

  ink: "#0f172a"
  ink-secondary: "#475569"
  ink-muted: "#64748b"
  ink-disabled: "#94a3b8"
  ink-inverse: "#f8fafc"

  status-queued-soft: "#eef1f6"
  status-queued-text: "#475569"
  status-queued-solid: "#64748b"
  status-transit-soft: "#e0f2fe"
  status-transit-text: "#075985"
  status-transit-solid: "#0284c7"
  status-attention-soft: "#fef3c7"
  status-attention-text: "#92400e"
  status-attention-solid: "#d97706"
  status-breach-soft: "#fee2e2"
  status-breach-text: "#991b1b"
  status-breach-solid: "#dc2626"
  status-settled-soft: "#dcfce7"
  status-settled-text: "#14532d"
  status-settled-solid: "#16a34a"
  status-ai-soft: "#ede9fe"
  status-ai-text: "#5b21b6"
  status-ai-solid: "#7c3aed"
  status-ai-border: "#ddd6fe"

  chart-1: "#1f4fa0"
  chart-2: "#0f8f86"
  chart-3: "#a8562c"
  chart-4: "#5c7a1e"
  chart-5: "#8a3b6b"
  chart-6: "#546578"
  chart-seq-1: "#dbe6f8"
  chart-seq-2: "#a9c3ee"
  chart-seq-3: "#6f95dd"
  chart-seq-4: "#3a67bd"
  chart-seq-5: "#124191"
  chart-grid: "#e1e6ee"

dark:
  brand: "#4d84e8"
  brand-hover: "#6b9bf0"
  brand-pressed: "#3d6fce"
  brand-soft: "#152742"
  brand-border: "#26436f"
  brand-text: "#8fb4f5"
  on-brand: "#0b1016"

  canvas: "#0b1016"
  surface: "#121924"
  surface-sunken: "#0e141d"
  surface-raised: "#18212e"
  surface-hover: "#1b2533"
  surface-selected: "#152742"
  hairline: "#232e3d"
  hairline-strong: "#334154"

  ink: "#e8edf5"
  ink-secondary: "#a4b0c2"
  ink-muted: "#7d8a9d"
  ink-disabled: "#5a6878"
  ink-inverse: "#0b1016"

  status-queued-soft: "#1b2533"
  status-queued-text: "#a4b0c2"
  status-queued-solid: "#64748b"
  status-transit-soft: "#0c2a3d"
  status-transit-text: "#7dd3fc"
  status-transit-solid: "#0ea5e9"
  status-attention-soft: "#33250a"
  status-attention-text: "#fcd34d"
  status-attention-solid: "#f59e0b"
  status-breach-soft: "#3a1513"
  status-breach-text: "#fca5a5"
  status-breach-solid: "#ef4444"
  status-settled-soft: "#0d2a19"
  status-settled-text: "#86efac"
  status-settled-solid: "#22c55e"
  status-ai-soft: "#231a3d"
  status-ai-text: "#c4b5fd"
  status-ai-solid: "#8b5cf6"
  status-ai-border: "#3b2d63"
  chart-grid: "#232e3d"

typography:
  families:
    sans: "Inter, Noto Sans Bengali, system-ui, -apple-system, Segoe UI, sans-serif"
    mono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
  display:
    fontFamily: "{typography.families.sans}"
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  heading-xl:
    fontFamily: "{typography.families.sans}"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: "{typography.families.sans}"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  heading-md:
    fontFamily: "{typography.families.sans}"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.01em
  heading-sm:
    fontFamily: "{typography.families.sans}"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "{typography.families.sans}"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-md:
    fontFamily: "{typography.families.sans}"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "{typography.families.sans}"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  label:
    fontFamily: "{typography.families.sans}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  caption:
    fontFamily: "{typography.families.sans}"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  overline:
    fontFamily: "{typography.families.sans}"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.06em
    textTransform: uppercase
  numeric:
    fontFamily: "{typography.families.sans}"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    fontVariantNumeric: tabular-nums
  numeric-lg:
    fontFamily: "{typography.families.sans}"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
    fontVariantNumeric: tabular-nums
  mono-md:
    fontFamily: "{typography.families.mono}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  mono-sm:
    fontFamily: "{typography.families.mono}"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "{typography.families.sans}"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  button-sm:
    fontFamily: "{typography.families.sans}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  kbd:
    fontFamily: "{typography.families.mono}"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0

density:
  comfortable:
    rowHeight: 52px
    cellPaddingY: 14px
    cellPaddingX: 14px
    controlHeight: 40px
    stackGap: "{spacing.md}"
  compact:
    rowHeight: 40px
    cellPaddingY: 8px
    cellPaddingX: 12px
    controlHeight: 32px
    stackGap: "{spacing.sm}"
  field:
    rowHeight: 64px
    cellPaddingY: 18px
    cellPaddingX: 16px
    controlHeight: 56px
    stackGap: "{spacing.base}"
    bodySize: 16px

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  page: 32px
  page-mobile: 20px
  section-gap: 24px

elevation:
  e0: "none"
  e1: "0 1px 2px rgba(15, 23, 42, 0.06)"
  e2: "0 4px 12px -2px rgba(15, 23, 42, 0.10)"
  e3: "0 12px 32px -8px rgba(15, 23, 42, 0.18)"
  e4: "0 24px 56px -12px rgba(15, 23, 42, 0.24)"
  focus-ring: "0 0 0 2px {colors.canvas}, 0 0 0 4px {colors.brand}"
  focus-ring-danger: "0 0 0 2px {colors.canvas}, 0 0 0 4px {colors.status-breach-solid}"

motion:
  instant: 80ms
  fast: 140ms
  base: 200ms
  slow: 320ms
  ease-standard: "cubic-bezier(0.2, 0, 0, 1)"
  ease-entrance: "cubic-bezier(0.05, 0.7, 0.1, 1)"
  ease-exit: "cubic-bezier(0.3, 0, 0.8, 0.15)"
  reduced: "1ms for all transforms and dimension changes; opacity may keep {motion.fast}"

layering:
  base: 0
  sticky: 20
  sidebar: 30
  dropdown: 50
  drawer: 60
  modal: 80
  toast: 90
  tooltip: 100

breakpoints:
  sm: 640px
  md: 880px
  lg: 1280px
  xl: 1600px

components:
  app-shell:
    status: built
    layout: "sidebar + content column, 100vh, no page scroll — only main scrolls"
  sidebar:
    status: built
    width: 240px
    widthCollapsed: 56px
    backgroundColor: "{colors.surface}"
    borderRight: "1px solid {colors.hairline}"
    zIndex: "{layering.sidebar}"
  sidebar-header:
    status: built
    height: 60px
    borderBottom: "1px solid {colors.hairline}"
    padding: "0 {spacing.md}"
  brand-mark:
    status: built
    size: 30px
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.md}"
  nav-item:
    status: built
    height: 40px
    padding: "0 {spacing.md}"
    gap: "{spacing.md}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
  nav-item-hover:
    status: built
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
  nav-item-active:
    status: built
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-text}"
    fontWeight: 600
    marker: "3px x 20px {colors.brand} bar, right edge, {rounded.sm}"
  nav-group-label:
    status: proposed
    typography: "{typography.overline}"
    textColor: "{colors.ink-muted}"
    padding: "{spacing.base} {spacing.md} {spacing.xs}"
  topbar:
    status: built
    height: 60px
    backgroundColor: "{colors.surface}/0.92 with 8px backdrop blur"
    borderBottom: "1px solid {colors.hairline}"
    padding: "0 {spacing.lg}"
    zIndex: "{layering.sticky}"
  breadcrumb:
    status: built
    typography: "{typography.body-md}"
    fontWeight: 600
    separatorColor: "{colors.ink-muted}"
  page-container:
    status: built
    maxWidth: 1100px
    padding: "{spacing.page}"
  page-container-wide:
    status: proposed
    maxWidth: none
    padding: "{spacing.page}"
    use: "queue and table pages — a 12-column table must not be capped at 1100px"
  page-header:
    status: built
    marginBottom: "{spacing.xl}"
    titleTypography: "{typography.heading-xl}"
    descriptionTypography: "{typography.body-md}"
    descriptionColor: "{colors.ink-muted}"
  command-palette:
    status: proposed
    trigger: "Cmd/Ctrl+K"
    width: 560px
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    boxShadow: "{elevation.e4}"
    zIndex: "{layering.modal}"

  button-primary:
    status: built
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    height: "{density.comfortable.controlHeight}"
    boxShadow: "{elevation.e1}"
  button-primary-hover:
    status: built
    backgroundColor: "{colors.brand-hover}"
  button-primary-active:
    status: built
    backgroundColor: "{colors.brand-pressed}"
    transform: "translateY(1px)"
  button-primary-disabled:
    status: built
    opacity: 0.55
    cursor: not-allowed
  button-primary-loading:
    status: proposed
    content: "spinner replaces the leading icon; label stays; width is frozen; aria-busy true"
  button-secondary:
    status: proposed
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-strong}"
    rounded: "{rounded.md}"
    height: "{density.comfortable.controlHeight}"
  button-ghost:
    status: built
    backgroundColor: transparent
    textColor: "{colors.ink}"
    hoverBackgroundColor: "{colors.surface-hover}"
  button-danger:
    status: built
    backgroundColor: "{colors.status-breach-solid}"
    textColor: "{colors.ink-inverse}"
    focusRing: "{elevation.focus-ring-danger}"
  button-icon:
    status: built
    size: 40px
    backgroundColor: transparent
    rounded: "{rounded.md}"
    hoverBackgroundColor: "{colors.surface-hover}"
  button-link:
    status: built
    textColor: "{colors.brand-text}"
    fontWeight: 600
    underline: "on hover and focus-visible"
  split-button:
    status: proposed
    use: "primary action plus a menu of variants, e.g. Dispatch / Dispatch and notify sender"

  form-field:
    status: built
    gap: "{spacing.xs}"
    labelTypography: "{typography.label}"
    labelColor: "{colors.ink-secondary}"
    helperTypography: "{typography.caption}"
    helperColor: "{colors.ink-muted}"
    errorColor: "{colors.status-breach-text}"
  text-input:
    status: built
    height: "{density.comfortable.controlHeight}"
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-strong}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    typography: "{typography.body-md}"
  text-input-focus:
    status: built
    borderColor: "{colors.brand}"
    boxShadow: "{elevation.focus-ring}"
  text-input-error:
    status: proposed
    borderColor: "{colors.status-breach-solid}"
    messageSlot: "below the field, {typography.caption}, prefixed by an alert icon"
  text-input-disabled:
    status: proposed
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-disabled}"
  textarea:
    status: proposed
    minHeight: 96px
    padding: "{spacing.sm} {spacing.md}"
    use: "case notes — the one place body-lg is allowed inside a form"
  select:
    status: built
    height: "{density.comfortable.controlHeight}"
    chevron: "{colors.ink-muted}"
  combobox:
    status: proposed
    use: "hub picker, rider picker — always typeahead, never a long native select"
    listMaxHeight: 280px
    boxShadow: "{elevation.e2}"
  multiselect:
    status: proposed
    use: "queue filters — selected values render as removable {component.chip}"
  checkbox:
    status: proposed
    size: 16px
    rounded: "{rounded.xs}"
    checkedColor: "{colors.brand}"
  radio:
    status: proposed
    size: 16px
    rounded: "{rounded.pill}"
  switch:
    status: proposed
    width: 36px
    height: 20px
    onColor: "{colors.brand}"
    use: "settings only — never for an action that writes immediately without confirmation"
  date-input:
    status: proposed
    format: "YYYY-MM-DD, Asia/Dhaka, per P7 these are strings not instants"
  time-input:
    status: proposed
    format: "HH:mm 24-hour"
  phone-input:
    status: proposed
    format: "+880 1X XXX-XXXXX, dial code fixed and non-editable"
    typography: "{typography.mono-md}"
  file-drop:
    status: proposed
    minHeight: 120px
    border: "1px dashed {colors.hairline-strong}"
    rounded: "{rounded.lg}"
    activeBorderColor: "{colors.brand}"
  search-box:
    status: built
    maxWidth: 360px
    height: "{density.comfortable.controlHeight}"
    icon: "leading, {colors.ink-muted}"
    clearAffordance: "trailing x, appears only when non-empty"
  filter-bar:
    status: built
    layout: "auto-fit grid, minmax(160px, 1fr), gap {spacing.md}"
    resetAffordance: "text button, only rendered when at least one filter is set"
  scan-input:
    status: proposed
    height: 56px
    typography: "{typography.mono-md}"
    fontSize: 18px
    autoFocus: true
    use: "hub intake — the single most-used control in the building; it owns focus on mount and re-takes it after every successful scan"

  table-shell:
    status: built
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    boxShadow: "{elevation.e1}"
    overflowX: auto
  table-header-cell:
    status: built
    typography: "{typography.overline}"
    textColor: "{colors.ink-muted}"
    backgroundColor: "{colors.surface}"
    borderBottom: "1px solid {colors.hairline}"
    position: "sticky top 0"
  table-row:
    status: built
    height: "{density.comfortable.rowHeight}"
    borderBottom: "1px solid {colors.hairline}"
  table-row-hover:
    status: built
    backgroundColor: "{colors.surface-hover}"
  table-row-selected:
    status: proposed
    backgroundColor: "{colors.surface-selected}"
    marker: "2px {colors.brand} left border"
  table-row-breaching:
    status: proposed
    marker: "2px {colors.status-breach-solid} left border — never a full-row red fill"
  table-cell-mono:
    status: proposed
    typography: "{typography.mono-md}"
    use: "tracking number, case id, movement id"
  table-cell-numeric:
    status: proposed
    typography: "{typography.numeric}"
    textAlign: right
    use: "COD amount, counts, weights"
  table-sort-indicator:
    status: proposed
    size: 14px
    color: "{colors.ink-muted}"
    activeColor: "{colors.brand}"
  row-actions:
    status: built
    justify: flex-end
    gap: "{spacing.xs}"
    behaviour: "primary action is always visible; the rest collapse into a kebab menu"
  bulk-action-bar:
    status: proposed
    position: "sticky bottom, inside the table shell"
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.lg}"
    boxShadow: "{elevation.e3}"
  pagination:
    status: built
    typography: "{typography.body-sm}"
    textColor: "{colors.ink-muted}"
    controls: "prev/next plus page-size select; total count always shown"
  column-toggle:
    status: proposed
    use: "queue tables — lets a hub choose which of the denormalised snapshot fields it cares about"
  density-toggle:
    status: proposed
    options: ["comfortable", "compact"]
    persistence: "localStorage, per user"

  status-pill:
    status: built
    rounded: "{rounded.pill}"
    typography: "{typography.caption}"
    fontWeight: 600
    padding: "{spacing.xs} {spacing.sm}"
    requirement: "colour plus a text label always; an icon as well where the pill may appear without its column header"
  sla-chip:
    status: proposed
    typography: "{typography.numeric}"
    fontSize: 12px
    rounded: "{rounded.sm}"
    scale: "more than 4h remaining = queued tokens; under 4h = attention tokens; past due = breach tokens; closed = settled tokens"
    content: "relative remaining time, e.g. 2h 14m, with the absolute due time in the title attribute"
  custody-badge:
    status: proposed
    values: ["hub", "rider", "sender", "receiver", "unknown"]
    rendering: "icon plus label; unknown always uses attention tokens, never queued — an unknown custody is a problem, not a neutral fact"
  tracking-number:
    status: proposed
    typography: "{typography.mono-md}"
    affordance: "click to copy, with a transient confirmation"
  cod-amount:
    status: proposed
    typography: "{typography.numeric}"
    format: "BDT with a leading currency symbol, two decimals, right-aligned"
    note: "a reversing or refund amount renders in {colors.status-breach-text} with an explicit minus"
  hub-tag:
    status: proposed
    typography: "{typography.mono-sm}"
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.sm}"
    content: "hub code, e.g. MIRPUR10, with the full name in a tooltip"
  rider-chip:
    status: proposed
    content: "avatar plus name; phone only where the viewer's role permits it"
  ai-proposal-card:
    status: proposed
    backgroundColor: "{colors.status-ai-soft}"
    border: "1px solid {colors.status-ai-border}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.base}"
    header: "sparkle icon plus Proposed by AI plus a confidence value; never rendered without an explicit accept and reject pair"
  decision-card:
    status: proposed
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    header: "the confirming person's name and the timestamp — a decision is attributable or it is not a decision"
  case-timeline:
    status: proposed
    layout: "vertical rail, 2px {colors.hairline}, 8px dots"
    dotColor: "the status channel token for that event type"
    itemTypography: "{typography.body-sm}"
  case-summary-panel:
    status: proposed
    use: "the denormalised ExceptionCase snapshot, rendered as a labelled key-value grid"
  queue-card:
    status: proposed
    use: "field mode replacement for a table row"
    minHeight: "{density.field.rowHeight}"
    padding: "{spacing.base}"
    rounded: "{rounded.lg}"
  money-row:
    status: proposed
    use: "MoneyTransaction log — type, counterparties, amount, reference; reversals are struck through and linked to the reversing entry"
  stale-banner:
    status: proposed
    backgroundColor: "{colors.status-attention-soft}"
    textColor: "{colors.status-attention-text}"
    use: "shown on a case whose HubReceipt is at appliedState pending — the snapshot on screen may lag the authoritative record until reconciliation runs"
  stat-tile:
    status: built
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "{spacing.base}"
    labelTypography: "{typography.body-sm}"
    valueTypography: "{typography.numeric-lg}"

  modal:
    status: built
    maxWidth: 520px
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    boxShadow: "{elevation.e3}"
    zIndex: "{layering.modal}"
  modal-backdrop:
    status: built
    backgroundColor: "rgba(15, 23, 42, 0.35)"
    backdropFilter: "blur(2px)"
  confirm-dialog:
    status: built
    use: "any irreversible write — ownership transfer, dispatch, case close, money reversal"
    requirement: "names the specific record, not the action class; the confirming button carries the verb, never OK"
  drawer:
    status: proposed
    width: 480px
    side: right
    use: "case detail opened from a queue without losing queue position"
    zIndex: "{layering.drawer}"
  dropdown-menu:
    status: built
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.md}"
    boxShadow: "{elevation.e2}"
    zIndex: "{layering.dropdown}"
    animation: "blocks-menu-in, {motion.fast} {motion.ease-entrance}"
  popover:
    status: proposed
    maxWidth: 320px
    boxShadow: "{elevation.e2}"
  tooltip:
    status: built
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    zIndex: "{layering.tooltip}"
    delay: "400ms open, 0ms close"
  toast:
    status: proposed
    position: "bottom-right, stacked, max 3 visible"
    width: 360px
    boxShadow: "{elevation.e3}"
    zIndex: "{layering.toast}"
    duration: "5s for success, sticky for error"
  inline-alert:
    status: built
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.base}"
    typography: "{typography.body-sm}"
    variants: ["info", "attention", "breach", "settled"]
  empty-state:
    status: built
    padding: "{spacing.xxl}"
    requirement: "an icon, one sentence of cause, and exactly one action — an empty queue is good news and should read that way"
  error-state:
    status: built
    textColor: "{colors.status-breach-text}"
    requirement: "what failed, and a retry; the raw error goes behind a disclosure, never in the headline"
  skeleton:
    status: built
    animation: "shimmer 1.4s ease infinite"
    requirement: "matches the shape of the content it replaces, including row count"
  spinner:
    status: built
    size: 28px
    borderColor: "{colors.hairline}"
    topColor: "{colors.brand}"
  progress-bar:
    status: proposed
    height: 4px
    trackColor: "{colors.surface-sunken}"
    fillColor: "{colors.brand}"

  tabs:
    status: proposed
    indicator: "2px {colors.brand} underline"
    typography: "{typography.body-md}"
  segmented-control:
    status: proposed
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.md}"
    use: "queue scoping — mine / hub / all"
  chip:
    status: built
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.pill}"
    typography: "{typography.caption}"
    fontWeight: 600
  badge-count:
    status: proposed
    minWidth: 18px
    backgroundColor: "{colors.status-breach-solid}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.kbd}"
  avatar:
    status: built
    sizes: { sm: 32px, lg: 56px }
    rounded: "{rounded.pill}"
  kbd:
    status: proposed
    typography: "{typography.kbd}"
    border: "1px solid {colors.hairline-strong}"
    rounded: "{rounded.xs}"
  json-panel:
    status: built
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.md}"
    use: "debug and audit surfaces only — never a primary read path for an operator"
---

## Overview

PathaoPoth is an **operations console**, and its design language follows from that single fact. The
reader is not a visitor being persuaded; they are a hub operator with a queue of forty exception
cases, a rider standing in the rain, or a care agent working a triage list for the eighth hour. The
system optimises for **scanning speed, unambiguous state, and correct attribution** — in that order.

The atmosphere is a cool near-neutral canvas (`{colors.canvas}` — #f4f6f9) carrying white data
surfaces (`{colors.surface}`). Type is a single grotesque, **Inter at 14px base**, with tabular
numerals for money and monospace for identifiers. There is no display serif, no hero, no marketing
band. Hierarchy comes from weight, size, and alignment.

**The central rule: colour is a data channel.** Every hue in this system means something operational,
and the brand colour deliberately stays out of the way:

1. **Route blue** (`{colors.brand}` — #124191) — navigation position, primary action, selection, focus.
   Three jobs, no others.
2. **The status ramp** — queued, transit, attention, breach, settled. Maps onto `ExceptionCase.status`
   and the SLA clock. Nothing decorative may use these hues.
3. **The provenance channel** (`{colors.status-ai-solid}` — violet) — content the AI proposed that no
   human has confirmed. Disappears on confirmation.

Everything else is neutral. A card is white with a hairline; a panel is white with a hairline; the
page is grey. That flatness is the point — it makes the six meaningful colours impossible to miss.

**Key Characteristics:**

- Cool canvas `{colors.canvas}` with white surfaces and a `{colors.hairline}` border language.
  Elevation is used only for things that genuinely float (menus, modals, toasts).
- **14px body**, not 16px. The whole scale is compressed for density; `{typography.body-lg}` at 15px
  exists only for case notes, which are actually read rather than scanned.
- **Three densities.** Comfortable (52px rows) default, compact (40px) as a persisted preference,
  field (64px rows, 56px targets, 16px body) for riders.
- **Tabular numerals everywhere numbers stack vertically** — COD columns, counts, SLA clocks. Money
  right-aligned; identifiers in `{typography.mono-md}`.
- **Six documented interaction states** on every interactive element. This is normative, and it is the
  deliberate inverse of the marketing system this file's format came from.
- **Dark theme is a second palette**, not an inversion — its own elevation ladder, its own status
  tints, and a lightened brand blue that keeps contrast against a dark surface.
- **Bengali is a first-class locale.** The font stack falls through per glyph, line-height opens up,
  and no component may assume English string length.

## Colors

### Brand — three jobs only

| Token | Value | Use |
|---|---|---|
| `{colors.brand}` | #124191 | Primary button fill, active nav marker, focus ring, selected-row border |
| `{colors.brand-hover}` | #0e3576 | Primary button hover |
| `{colors.brand-pressed}` | #0a2a5c | Primary button active/pressed |
| `{colors.brand-soft}` | #e8eefb | Active nav background, selected table row |
| `{colors.brand-border}` | #b9cdf2 | Border on soft-brand surfaces |
| `{colors.brand-text}` | #1a4fa8 | Inline links and link buttons — darker than the fill so it passes 4.5:1 on white |

The brand never fills a card, never appears as a status, and never enters a chart except as the
sequential ramp.

### Surface

| Token | Value | Use |
|---|---|---|
| `{colors.canvas}` | #f4f6f9 | Page floor behind everything |
| `{colors.surface}` | #ffffff | Cards, panels, table shells, inputs |
| `{colors.surface-sunken}` | #eef1f6 | Wells, segmented control track, hub tags, inline code |
| `{colors.surface-hover}` | #f6f8fb | Row and nav hover |
| `{colors.surface-selected}` | #e8eefb | Selected row — same value as `brand-soft`, named separately because its meaning is different |
| `{colors.hairline}` | #e1e6ee | The default border. Most structure in this system is a hairline, not a shadow |
| `{colors.hairline-strong}` | #c9d2e0 | Input borders, where the boundary must be findable |

### Text

| Token | Value | Use |
|---|---|---|
| `{colors.ink}` | #0f172a | Primary content, headings, table values |
| `{colors.ink-secondary}` | #475569 | Form labels, secondary values |
| `{colors.ink-muted}` | #64748b | Captions, table headers, helper text, inactive nav |
| `{colors.ink-disabled}` | #94a3b8 | Disabled control text. Never used for real content |

### Status channel

Six states, each with a **soft** background, a **text** foreground, and a **solid** for markers, dots
and chart series. The soft/text pairs all clear 4.5:1.

| Channel | Soft | Text | Solid | Meaning |
|---|---|---|---|---|
| queued | #eef1f6 | #475569 | #64748b | In a queue, nothing wrong, no clock pressure |
| transit | #e0f2fe | #075985 | #0284c7 | Movement in flight; custody with a rider |
| attention | #fef3c7 | #92400e | #d97706 | SLA under 4h, unknown custody, pending reconciliation |
| breach | #fee2e2 | #991b1b | #dc2626 | Past `slaDueAt`, failed write, reversed money |
| settled | #dcfce7 | #14532d | #16a34a | Case closed, money settled, receipt applied |
| ai | #ede9fe | #5b21b6 | #7c3aed | Proposed, not confirmed — see below |

**Rules.** No hue in this table may be used for anything outside its channel. A "breach" red on a
decorative element trains the reader to ignore red. Conversely, a status must never be encoded by
colour alone — every `{component.status-pill}` carries a text label, and where a pill can appear
away from its column header it carries an icon as well.

### Provenance channel

Violet marks one thing: **content generated by `AiAnalysis` that no human has confirmed through a
`CaseDecision`.** An `{component.ai-proposal-card}` is violet; the moment a human accepts it, the
record becomes a `{component.decision-card}` — white, hairline-bordered, stamped with the confirming
person's name — and the violet is gone.

This is the most load-bearing colour decision in the product. A proposed destination hub that reads
as a confirmed one moves a parcel nobody checked.

### Charts

Two ramps, and a rule about when each applies.

- **Sequential** (`chart-seq-1` … `chart-seq-5`) — tints of route blue. The default. Use for volume
  over time, throughput, anything ordinal.
- **Categorical** (`chart-1` … `chart-6`: #1f4fa0 blue, #0f8f86 teal, #a8562c rust, #5c7a1e olive,
  #8a3b6b plum, #546578 slate) — only for genuinely nominal series, e.g. per-hub comparison.

**The rule:** never colour a chart series by the categorical ramp when the series *is* a status. A
breakdown by case status uses the **status solids** — otherwise the same information carries two
different colour codings on one screen. Grid lines are `{colors.chart-grid}`; axes are
`{colors.ink-muted}`; never more than six categorical series, and beyond four, label the marks
directly instead of relying on a legend.

### Dark theme

Not an inversion. A parallel palette under `dark:` with:

- Its own surface ladder — canvas #0b1016, surface #121924, raised #18212e. Elevation in dark comes
  from **surface lightening**, because shadows barely register on a dark ground. A modal in dark is
  lighter than the page, not shadowed onto it.
- A **lightened brand** (#4d84e8). #124191 on a dark surface fails contrast; the fill lightens and
  `on-brand` flips to near-black.
- **Status tints, not status washes.** Soft backgrounds become deep, desaturated versions; the text
  foreground becomes the light end of each hue.

Implementation note: the app stores tokens as HSL channels on `:root` in
[styles.css](pathaopoth-web/src/app/styles.css) and switches with `prefers-color-scheme`. Keep that
mechanism, and add an explicit user override (`data-theme`) so a hub screen can be pinned to dark for
a night shift regardless of the OS.

## Typography

### Families

| Role | Stack | Note |
|---|---|---|
| Sans | `Inter, Noto Sans Bengali, system-ui, …` | One family for the entire UI. Bengali resolves per glyph via fallback, so a mixed en/bn string renders correctly without a wrapper |
| Mono | `JetBrains Mono, ui-monospace, …` | Identifiers, timestamps, JSON. **Not** general numbers |

Numbers in tables use the **sans** family with `font-variant-numeric: tabular-nums`, not mono. Mono is
reserved for strings a human might transcribe or compare character by character: tracking numbers,
`ItemId`s, hub codes.

### Hierarchy

| Style | Size / Weight | Use |
|---|---|---|
| `{typography.display}` | 30 / 600 | Auth screens and 404 only |
| `{typography.heading-xl}` | 24 / 600 | Page title |
| `{typography.heading-lg}` | 20 / 600 | Section heading |
| `{typography.heading-md}` | 16 / 600 | Card and panel title |
| `{typography.heading-sm}` | 14 / 600 | Dialog title, subsection, table group header |
| `{typography.body-lg}` | 15 / 400 | Case notes and other prose actually read |
| `{typography.body-md}` | 14 / 400 | **Default.** Table cells, form values, nav |
| `{typography.body-sm}` | 13 / 400 | Secondary values, pagination, timeline items |
| `{typography.label}` | 13 / 500 | Form labels |
| `{typography.caption}` | 12 / 400 | Helper text, meta, pills |
| `{typography.overline}` | 11 / 600 / +0.06em caps | Table headers, panel eyebrows |
| `{typography.numeric}` | 14 / 500 tabular | Money and count columns |
| `{typography.numeric-lg}` | 22 / 600 tabular | Stat tile values |
| `{typography.mono-md}` | 13 / 500 | Tracking numbers, case ids |
| `{typography.mono-sm}` | 12 / 400 | Timestamps, raw ids, JSON |

### Numerals and identifiers

- **Money is right-aligned, tabular, two decimals, with the currency symbol.** A COD column where the
  decimal points do not line up is a bug.
- **Negative or reversing amounts** take `{colors.status-breach-text}` and an explicit minus sign.
  Colour is never the only signal.
- **Timestamps** render as local Asia/Dhaka with the timezone shown where a record crosses hubs.
  Relative time ("14m ago") in the primary slot, absolute in the `title`.
- **Per P7 in the schema design**, calendar dates and times-of-day are strings, not instants. Render
  them verbatim; do not pass them through a timezone conversion.

### Bengali

| Property | English | Bangla |
|---|---|---|
| line-height | as specified | **+0.15** on every style |
| letter-spacing | negative on headings | **0** — never condense Bengali |
| text-transform | uppercase on `overline` | **none** — Bengali has no case |
| string budget | baseline | assume **+30%** width |

Tracking numbers, hub codes, and `ItemId`s stay Latin in every locale.

### Principles

- One family, one weight axis. Emphasis is 600, never 700, and never italic.
- Never below 11px. `{typography.overline}` is the floor, and only for labels.
- Line length caps at ~72 characters for prose; table cells truncate with an ellipsis and a `title`.
- A number that will be compared to the number above it is tabular. No exceptions.

## Layout

### Spacing

Base unit 4px. `{spacing.xxs}` 2 · `{spacing.xs}` 4 · `{spacing.sm}` 8 · `{spacing.md}` 12 ·
`{spacing.base}` 16 · `{spacing.lg}` 20 · `{spacing.xl}` 24 · `{spacing.xxl}` 32 · `{spacing.xxxl}` 40.

- **Page padding** `{spacing.page}` (32px), dropping to `{spacing.page-mobile}` (20px) below `md`.
- **Between page sections** `{spacing.section-gap}` (24px). There is no 96px marketing rhythm here;
  vertical space that carries no information is space an operator has to scroll past.
- **Card padding** `{spacing.base}` (16px) at compact, `{spacing.lg}` (20px) at comfortable.

### Density

| | Comfortable | Compact | Field |
|---|---|---|---|
| Table row | 52px | 40px | 64px (card) |
| Control height | 40px | 32px | 56px |
| Cell padding | 14px | 8px / 12px | 18px / 16px |
| Body size | 14px | 14px | 16px |
| Selected by | default | user preference, persisted | role + viewport |

Compact is a **preference**, stored per user and applied globally — never a per-table toggle, which
would make two tables on one screen disagree. Field mode is chosen by role *and* viewport together: a
care agent on a tablet keeps the desk console.

### Grid and container

- **Standard pages** cap at 1100px, centred — profile, settings, single-case detail.
- **Queue and table pages** use `{component.page-container-wide}`: no cap. A twelve-column exception
  queue must be allowed to use the monitor it is on.
- **Form grids** are two-column at `lg` and above, one column below, with full-width action rows.
- **Filter bars** are `auto-fit, minmax(160px, 1fr)`.
- **Detail layout** is a 2:1 split — case body left, summary panel right — collapsing to stacked
  below `lg` with the summary panel *first*, because on a phone the snapshot matters more than history.

### App shell anatomy

```
┌──────────┬────────────────────────────────────────┐
│ sidebar  │ topbar   breadcrumb ··· lang notif user│  60px, sticky
│ 240/56px ├────────────────────────────────────────┤
│          │ main (the only scrolling region)       │
│ nav      │   page-header                          │
│          │   content                              │
└──────────┴────────────────────────────────────────┘
```

The shell is `100vh` and does not scroll; only `main` does. That keeps the topbar and nav reachable
with a queue of four hundred rows below. The sidebar collapses to a 56px icon rail — **never to
nothing**, and on mobile it is *always* the rail rather than an overlay drawer, so there is no state
where navigation has disappeared and no visible control brings it back.

## Elevation and Layering

| Level | Shadow | Use |
|---|---|---|
| `{elevation.e0}` | none | In-flow content; structure comes from `{colors.hairline}` |
| `{elevation.e1}` | 0 1px 2px / 6% | Cards, table shells, stat tiles, primary button |
| `{elevation.e2}` | 0 4px 12px -2px / 10% | Dropdowns, popovers, combobox lists |
| `{elevation.e3}` | 0 12px 32px -8px / 18% | Modals, drawers, toasts, bulk-action bar |
| `{elevation.e4}` | 0 24px 56px -12% / 24% | Command palette |

**Border first, shadow second.** Anything that sits in the document flow gets a hairline. Shadow is
reserved for things that genuinely float above it — if it can be dismissed with Escape, it has a
shadow. In dark mode, substitute surface lightening for shadow at every level.

### Layering scale

`base` 0 · `sticky` 20 (topbar, sticky table header) · `sidebar` 30 · `dropdown` 50 · `drawer` 60 ·
`modal` 80 · `toast` 90 · `tooltip` 100.

Never write a raw z-index. A new floating surface picks the nearest existing rung or the scale gets a
new named rung — not a `z-index: 9999`.

## Motion

| Token | Duration | Use |
|---|---|---|
| `{motion.instant}` | 80ms | Hover and press feedback, focus ring |
| `{motion.fast}` | 140ms | Dropdowns, tooltips, toasts, chip removal |
| `{motion.base}` | 200ms | Sidebar collapse, drawer, modal, tab indicator |
| `{motion.slow}` | 320ms | Full-page transitions only (rare) |

Easing: `{motion.ease-standard}` for state changes, `{motion.ease-entrance}` for things arriving,
`{motion.ease-exit}` for things leaving — exits are always faster than entrances.

**Rules.**

- Nothing animates that the user did not cause. No auto-playing, no attention-seeking loops. The
  exception is `{component.skeleton}` shimmer and `{component.spinner}`, which communicate work.
- **Never animate a value that is being read.** An SLA countdown ticks; it does not roll or fade.
- Rows entering a live queue fade in over `{motion.fast}`; they never slide, because a moving list is
  unclickable.
- `prefers-reduced-motion: reduce` collapses every transform and dimension transition to 1ms. Opacity
  may keep `{motion.fast}`. This is not optional — riders use this in motion.

## Interaction States

**Normative.** Every interactive element implements all six. This section is the deliberate inverse of
the marketing system this file's format was borrowed from, which forbids documenting hover; in an
application, these states *are* the interface.

| State | Signal | Rule |
|---|---|---|
| **Default** | resting tokens | — |
| **Hover** | `{colors.surface-hover}` background, or one step darker on a filled control | Pointer only. Never the sole indicator of anything; a touch user must get the same information without it |
| **Focus-visible** | `{elevation.focus-ring}` — 2px canvas gap, 2px `{colors.brand}` | Applied via `:focus-visible`, never suppressed. Every custom control is reachable by Tab, in DOM order |
| **Active / pressed** | `{colors.brand-pressed}` and `translateY(1px)` | Fires on pointer-down, not on click, so a slow network still feels responsive |
| **Disabled** | opacity 0.55, `cursor: not-allowed`, `aria-disabled` | A disabled control **must** explain itself — a tooltip or adjacent helper saying why. A control that is disabled for an unexplained reason is a support ticket |
| **Loading** | spinner replaces the leading icon, label persists, width frozen, `aria-busy` | The control stays in the layout at the same size. Never swap a button for a spinner — the page must not reflow mid-click |

Plus two selection states where relevant: **selected** (`{colors.surface-selected}` with a 2px
`{colors.brand}` left border) and **invalid** (`{colors.status-breach-solid}` border plus a message
below the field — never a red border alone).

**Destructive actions** — ownership transfer, dispatch, case close, money reversal — additionally
require a `{component.confirm-dialog}` that names the specific record ("Close case for
`PP-4471-0092`?") and whose confirming button carries the verb, never "OK".

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Checkboxes, kbd, inline code, skeleton lines |
| `{rounded.sm}` | 6px | SLA chips, hub tags, small markers |
| `{rounded.md}` | 8px | **The default** — buttons, inputs, cards, tables, menus |
| `{rounded.lg}` | 12px | Modals, drawers, proposal cards, queue cards |
| `{rounded.xl}` | 16px | Auth card only |
| `{rounded.pill}` | 9999px | Status pills, chips, avatars, count badges |

One radius per surface — no mixed corners. Icons are Lucide at 16px inline, 18px in nav, 20px in
empty states; stroke width 2, never filled.

**No illustration, no photography, no stock art.** The product's visual content is its data. Empty
states use a single Lucide glyph at 32px in `{colors.ink-muted}`.

## Components

Entries in the YAML block are marked `status: built` (exists today in
[pathaopoth-web/src/shared/ui/](pathaopoth-web/src/shared/ui/) or the shell) or `status: proposed`
(specified here, not yet implemented). Build against the built ones; do not re-implement them.

### Shell and navigation
`app-shell` · `sidebar` · `sidebar-header` · `brand-mark` · `nav-item` (+hover, +active) ·
`nav-group-label` · `topbar` · `breadcrumb` · `page-container` (+wide) · `page-header` ·
`command-palette`

The active nav item is signalled **three ways at once** — soft background, brand text, and a 3px
right-edge bar — because nav position is the one thing a user must never have to hunt for. In the
collapsed rail the bar is dropped and a tooltip carries the label.

### Actions
`button-primary` (+hover, +active, +disabled, +loading) · `button-secondary` · `button-ghost` ·
`button-danger` · `button-icon` · `button-link` · `split-button`

One primary per view. If a screen appears to need two, one of them is secondary.

### Forms
`form-field` · `text-input` (+focus, +error, +disabled) · `textarea` · `select` · `combobox` ·
`multiselect` · `checkbox` · `radio` · `switch` · `date-input` · `time-input` · `phone-input` ·
`file-drop` · `search-box` · `filter-bar` · `scan-input`

`{component.scan-input}` deserves its own note: it is the single most-used control in a hub. It owns
focus on mount, re-takes focus after every successful scan, is 56px tall with 18px mono text, and
accepts a barcode-wedge keystroke burst ending in Enter. Nothing may steal its focus — including a
toast confirming the previous scan.

`{component.phone-input}` is subject to column-level security: `receiverPhone` is masked for
sender-facing roles. The component renders the mask, not an empty field, so the reader knows the data
exists and they lack access.

### Data display
`table-shell` · `table-header-cell` · `table-row` (+hover, +selected, +breaching) · `table-cell-mono` ·
`table-cell-numeric` · `table-sort-indicator` · `row-actions` · `bulk-action-bar` · `pagination` ·
`column-toggle` · `density-toggle` · `stat-tile`

Table rules: the header is sticky; the primary row action is always visible and the rest collapse into
a kebab; a breaching row gets a 2px red **left border**, never a red fill — a filled row destroys the
legibility of everything in it.

### Domain
`status-pill` · `sla-chip` · `custody-badge` · `tracking-number` · `cod-amount` · `hub-tag` ·
`rider-chip` · `ai-proposal-card` · `decision-card` · `case-timeline` · `case-summary-panel` ·
`queue-card` · `money-row` · `stale-banner`

These are what make this a PathaoPoth system rather than a generic admin theme. Two carry
architectural weight:

- **`{component.ai-proposal-card}`** — violet, always rendered with an explicit accept/reject pair,
  never auto-applied. It shows what the AI proposed *and* its confidence.
- **`{component.stale-banner}`** — the design doc's commit-point pattern (§5.2) means a case snapshot
  can legitimately lag its `HubReceipt` until reconciliation runs. When `appliedState = pending`, the
  case shows an attention-toned banner saying so. The UI tells the truth about its own consistency
  model rather than silently showing stale data.

### Overlays and feedback
`modal` · `modal-backdrop` · `confirm-dialog` · `drawer` · `dropdown-menu` · `popover` · `tooltip` ·
`toast` · `inline-alert` · `empty-state` · `error-state` · `skeleton` · `spinner` · `progress-bar`

Every async surface has four renderings: **loading** (skeleton shaped like the content, with the right
row count), **empty** (cause + one action), **error** (what failed + retry, raw detail behind a
disclosure), and **loaded**. A component that only handles the fourth is incomplete.

### Primitives
`tabs` · `segmented-control` · `chip` · `badge-count` · `avatar` · `kbd` · `json-panel`

## Accessibility

Not a section to skip: this product is used in poor light, in motion, and under time pressure.

- **Contrast.** Body text ≥ 4.5:1, `{typography.overline}` and disabled text ≥ 3:1 against their own
  background. Every status soft/text pair in the table above is verified at 4.5:1.
- **Colour is never the only channel.** Status carries a label; SLA carries a number; breaching rows
  carry a border *and* a pill; money sign carries a minus.
- **Focus is always visible.** `:focus-visible` with the 2px brand ring, never `outline: none`
  without a replacement. Modals and drawers trap focus and restore it to the trigger on close.
- **Touch targets** ≥ 40px desk, ≥ 56px field mode, with ≥ 8px between adjacent targets.
- **Keyboard.** Every queue action is reachable without a pointer. `/` focuses search, `Cmd/Ctrl+K`
  opens the palette, `Esc` closes the topmost layer, `j`/`k` move row selection in a queue.
- **Announcements.** Toasts are `aria-live="polite"`; a breach appearing in a queue is `assertive`.
  Loading regions set `aria-busy`.
- **Zoom.** The layout survives 200% browser zoom without horizontal page scroll; tables scroll
  inside their own shell.

## Field mode

A distinct rendering for riders, selected by role and viewport together.

- **Body 16px**, control height 56px, row height 64px. Never smaller — this is read at arm's length,
  outdoors, sometimes through a wet screen protector.
- **Tables become `{component.queue-card}` stacks.** A rider never reads a twelve-column table.
- **One primary action per card**, in the bottom two-thirds of the screen — the thumb zone. The
  destructive action is never adjacent to the primary one.
- **Higher contrast.** Field mode uses `{colors.ink}` for secondary text where the desk console uses
  `{colors.ink-muted}`, because sunlight eats the mid-greys.
- **Offline is a first-class state**, not an error. A pending write shows an attention-toned pill on
  the affected card and stays visible until the write lands.

## Do's and Don'ts

### Do
- Keep the brand blue to navigation, primary action, and selection. Three jobs.
- Make every colour mean something. If a reader has to learn that one red is decorative, the ramp is
  broken.
- Pair every status colour with a text label, and with an icon where the pill travels.
- Use tabular numerals for any number that stacks vertically, and right-align money.
- Mark AI-proposed content violet, and strip the violet the moment a human confirms it.
- Render all four async states — loading, empty, error, loaded — for every data surface.
- Give a disabled control a reason the user can read.
- Put structure in hairlines; reserve shadow for things that float and can be dismissed.
- Let queue pages use the full monitor width.

### Don't
- Don't fill a table row with a status colour. A 2px left border carries the same signal and keeps the
  row readable.
- Don't use 16px body on the desk console, or 14px in field mode. The density is chosen per context.
- Don't use mono for general numbers — mono is for identifiers a human transcribes.
- Don't introduce a seventh status hue. If a new state appears, map it onto the existing six or argue
  for replacing one.
- Don't colour a chart series by the categorical ramp when the series is a status — use the status
  solids.
- Don't animate anything the user did not cause, and don't animate a value being read.
- Don't collapse the sidebar to nothing on mobile, or hide the only control that restores it.
- Don't write a raw z-index. Use `{layering}`.
- Don't invert the light palette for dark mode. Dark has its own surfaces and its own lightened brand.
- Don't ship a confirm dialog whose button says "OK".

## Responsive Behavior

| Name | Width | Key changes |
|---|---|---|
| Mobile | < 640px | Field mode eligible; tables become card stacks; page padding 20px; form grids 1-up; filter bar collapses behind a Filters button |
| Tablet | 640–880px | Sidebar forced to the 56px rail; tables scroll horizontally inside their shell; detail layout stacks with the summary panel first |
| Desktop | 880–1280px | Sidebar expandable; detail layout 2:1; form grids 2-up |
| Wide | > 1280px | Queue pages uncapped; standard pages stay at 1100px; stat tiles 4-up |

### Collapsing strategy
- The sidebar is the rail below `md`, always — no overlay drawer, no scrim, no dead-end state.
- Tables reduce **columns by priority** before they shrink type. Column priority is declared per
  table; identifier, status, and SLA are never dropped.
- The topbar keeps user menu and notifications at every width; language switcher moves into the user
  menu below `sm`.
- Modals go full-screen below `sm`; drawers become bottom sheets.

## Iteration Guide

1. One component at a time, referenced by its YAML key (`{component.sla-chip}`).
2. States are separate entries (`-hover`, `-focus`, `-disabled`, `-loading`), not prose asides.
3. Use `{token.refs}` everywhere. Never inline a hex value in a component entry.
4. **Document all six interaction states.** A component entry without them is not finished.
5. Colour changes go through the channel question first: *which channel does this belong to?* If the
   answer is "none", it is neutral.
6. New components declare `status: proposed` until they exist in
   [pathaopoth-web/src/shared/ui/](pathaopoth-web/src/shared/ui/), then flip to `built`.
7. When emphasis is needed: weight before size, size before colour, colour last and only from a
   channel that already means what you need.
8. Anything added to `dark:` must be added to `colors:` in the same edit. A token that exists in only
   one theme is a bug waiting for a night shift.

## Known Gaps

- **Charts are specified but unproven.** No charting library is in
  [package.json](pathaopoth-web/package.json) yet; the ramps here have not been tested against a real
  dashboard. Verify the categorical set for deuteranopia before shipping the first chart.
- **The Bengali face is unloaded.** Noto Sans Bengali is named in the stack but not yet imported or
  self-hosted, so bn currently renders in a system fallback. Subset and self-host before the locale
  ships.
- **Field mode is a specification, not an implementation.** No role-plus-viewport selector exists; the
  app currently switches on viewport alone at 880px.
- **Offline behaviour is sketched, not designed.** The pending-write pill is named; the queue,
  retry policy, and conflict presentation are not.
- **Print and export are out of scope.** Manifests, COD settlement sheets, and hub handover slips will
  need a print stylesheet with its own density and no dark theme.
- **Notification and toast copy is undefined.** Tone, length, and the escalation rule for a breach
  arriving while the operator is elsewhere in the app are open.
- **Motion is specified but largely unimplemented** beyond the sidebar transition, the menu entrance,
  and the skeleton shimmer.
- **Contrast is verified for the status pairs only.** The chart ramps, the dark-theme brand, and the
  disabled tokens have not been measured.
