# DevPromptly Design System

## Direction & Feel

**DevPromptly** is a calm, professional workspace for creators who share and discover AI prompts. Blue-slate aesthetic — not corporate navy, not startup cyan. The mid-blue of a clear, focused workspace. Modern and casual, never futuristic.

- **Temperature**: Cool-neutral, approachable, calm
- **Density**: Spacious, breathing, uncluttered
- **Motion**: Smooth, subtle. No drama. Deceleration easing throughout.
- **Depth**: Blue-tinted borders + soft shadow halos on hover
- **Aesthetic**: Light, clean, professional — like a well-designed SaaS tool for creative people

---

## Color Palette

All colors trace back to one world: a focused creative workspace with clear blue-daylight.

### Surfaces
- **--void**: `#FFFFFF` (white canvas)
- **--ink**: `#F8FAFD` (slightly blue-tinted off-white, primary surface)
- **--carbon**: `#EEF2FA` (elevated surface, inputs)
- **--graphite**: `#E2E8F4` (hover states, deep embeds)

### Text Hierarchy
- **--parchment**: `#0F172A` (primary text, deep slate)
- **--stone**: `#475569` (secondary, slate-600)
- **--dust**: `rgba(71, 85, 105, 0.6)` (tertiary, muted metadata)
- **--whisper-text**: `rgba(71, 85, 105, 0.4)` (placeholders, disabled)

### Borders — blue-tinted progression
- **--whisper**: `rgba(59, 130, 246, 0.09)` (softest separation)
- **--smoke**: `rgba(59, 130, 246, 0.16)` (emphasis, hover borders)
- **--fog**: `rgba(59, 130, 246, 0.26)` (max emphasis, focus rings)

### Accents
- **--signal**: `#3B82F6` (mid-blue, THE action color)
- **--signal-mid**: `#2563EB` (hover/pressed state)
- **--signal-dim**: `rgba(59, 130, 246, 0.10)` (subtle backgrounds)
- **--signal-glow**: `rgba(59, 130, 246, 0.22)` (shadow glow on hover)
- **--community-pulse**: `#7C3AED` (purple, community/collaboration)
- **--community-dim**: `rgba(124, 58, 237, 0.10)`

### Semantic
- **--success**: `#059669`
- **--success-dim**: `rgba(5, 150, 105, 0.10)`
- **--warning**: `#D97706` (amber is ONLY for semantic warnings)
- **--warning-dim**: `rgba(217, 119, 6, 0.10)`
- **--destructive**: `#DC2626`
- **--destructive-dim**: `rgba(220, 38, 38, 0.10)`

### Token principle
Colors carry meaning. Amber (`--warning`) is semantic-only — it should never appear as a UI accent or action color. Blue (`--signal`) is the single identity color.

---

## Spacing System

Base unit: **4px**

- **Micro**: 2px (icon gaps)
- **Compact**: 4px (tight inner padding)
- **Component**: 8px (between elements in card)
- **Section**: 16px (between sections in page)
- **Major**: 32px+ (between major layout blocks)

---

## Depth Strategy

**Blue-tinted borders + soft halo on hover** (no heavy shadows)

Every surface has a defined elevation through lightness:
1. **Canvas** (--void): White base
2. **Level 1** (--ink): Cards, primary surfaces (blue-tinted off-white)
3. **Level 2** (--carbon): Inputs, dropdowns, elevated
4. **Level 3** (--graphite): Hover states, deep embeds

Borders use blue-tinted rgba values to create coherence with the accent color.

**Card hover signature**: `box-shadow: 0 0 0 3px var(--signal-dim), 0 4px 16px rgba(59,130,246,0.07), ...` — a subtle blue halo that breathes outward, inviting exploration.

---

## Typography

### Font Families
- **Headings**: `Plus Jakarta Sans, sans-serif` — personality, modern, friendly. Not decorative, not corporate.
- **Body**: `Inter, sans-serif` — readable, comfortable
- **Data/Code**: `JetBrains Mono, monospace` — precision

### Scale & Weight

**H1**: 56px, weight 700, tracking -0.022em
**H2**: 32px, weight 700, tracking -0.022em
**H3**: 18px, weight 700, tracking -0.022em
**Body**: 15px, weight 400, leading 1.6
**Label**: 13px, weight 500
**Meta**: 11px, weight 500, color var(--dust)
**Mono**: 11px, font-variant-numeric: tabular-nums

---

## Border Radius

- **--r-xs**: 4px (chips, tags)
- **--r-sm**: 6px (buttons, inputs, small cards)
- **--r-md**: 10px (standard cards, dropdowns)
- **--r-lg**: 16px (modals, hero sections)

---

## Component Patterns

### Cards

Hover state: blue halo (`0 0 0 3px var(--signal-dim)`) + translateY(-2px). No amber accent line.

**Prompt Card**:
- Surface: `--ink` background
- Snippet preview with `JetBrains Mono` code styling
- Creator chip + engagement metrics
- Tags at bottom

**Forum Post Card**:
- Avatar + username left
- Title and snippet
- Category pill
- Reply count, last activity

### Navigation

**Header**:
- Logo (DevPromptly image)
- Centered search, desktop only
- Nav: Explore | Communities | Tools
- CTA: "Compartir prompt" (blue, btn-signal)
- Active state: `color: var(--signal); background: var(--signal-dim)`

**Active nav links**: blue text + blue-dim background (not amber)

### Interactive States

- **Hover**: Background shifts to `--carbon` or `--ink`
- **Active/Focus**: Border `var(--signal)` + `box-shadow: 0 0 0 3px var(--signal-dim)`
- **Disabled**: opacity 0.4
- Transitions: 160–240ms ease

### Forms

- **Input backgrounds**: `--carbon` (inset feeling, slightly darker than canvas)
- **Input focus**: border `var(--signal)`, background shifts to `--void`, `box-shadow: 0 0 0 3px var(--signal-dim)`
- **Placeholder**: `var(--dust)`

---

## Motion

- **Micro**: 150ms (hover, focus)
- **Standard**: 200ms (state changes, fades)
- **Page transition**: 300ms (navigation)
- **Easing**: cubic-bezier(0.22, 1, 0.36, 1) (deceleration)

Animations available:
- `.animate-fade-up` — content entering from below
- `.animate-fade-in` — simple opacity fade
- `.animate-scale-in` — dropdown/modal reveal
- `.animate-slide-down` — panel reveals
- `.animate-pulse-soft` — activity indicators
- `.skeleton` — shimmer loading state
- Stagger classes: `.stagger-1` through `.stagger-6`

No spring, bounce, or elastic. Smooth and confident.

---

## Key Design Decisions

1. **Blue-tinted surfaces**: `#F8FAFD` instead of neutral `#F8F8F8` — creates systemic coherence with the blue accent without being obvious
2. **One accent color**: `--signal` (#3B82F6) is THE action color. Amber exists only as `--warning` for semantic states.
3. **Blue halo on hover**: Cards breathe outward with a blue glow — signature element unique to this product
4. **Plus Jakarta Sans over Space Grotesk**: More personality, less AI-template default
5. **Border-tint matches accent**: Borders use blue rgba — the system breathes as one
6. **Sidebar same color as content**: `--ink` background, separated by `--whisper` border only

---

## Files

1. `client/src/index.css` — CSS variables, base styles, components
2. `client/src/components/Header.tsx` — Navigation
3. `client/src/pages/Home.tsx` — Landing / personalized feed
4. `client/src/pages/PromptsPage.tsx` — Browse prompts
5. `client/src/pages/CommunitiesHub.tsx` — Communities
6. All other pages — use CSS tokens (cascade automatically)

---

## Status

System redesigned. Blue palette active. Space Grotesk → Plus Jakarta Sans complete.
