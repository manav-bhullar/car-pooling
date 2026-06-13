# CarpoolTU Component Specs — Part 5
## Overlays + Animation
**Token Reference:** theme-tokens.json
**Rule:** Every value references a token name, never a raw hex.

---

## Why These Three Are Last

CancelModal — the only true modal in the app.
SkeletonBlock — the loading system for the Trip screen.
AnimatedRouteLine — the emotional core of the Waiting screen.

These three are last because they depend on everything before them.
CancelModal references button specs from Part 3.
SkeletonBlock references surface tokens and card dimensions from Part 1.
AnimatedRouteLine is the culmination of every motion decision we made.

---

---

# CancelModal

## Purpose
The only modal in the entire app.
Appears when user clicks "Cancel Trip" on the Trip screen.

Why a modal here and nowhere else:
Cancelling a matched trip triggers cascade cancellation —
it returns ALL co-riders to the waiting queue.
This action affects other people, not just the current user.
The modal creates mandatory friction — the user must make
a conscious decision, not an accidental tap.

Every other cancel action in the app (cancel PENDING request)
uses inline confirmation or TextButton — no modal.
This one is different because the stakes are different.

## Variants
Single variant. One job.

## States

**closed**
- Not in DOM — removed entirely when closed
- Do not use visibility:hidden or display:none
- Reason: screen readers should not encounter hidden modal content

**opening**
- Overlay fades in simultaneously with card entrance
- Duration: see Animation Rules

**open**
- Full interactive state
- Focus trapped inside modal

**closing**
- Reverse of opening animation
- Fires on: "Keep Trip" click, overlay click (with restriction — see below)

## Layout Rules

**Overlay:**
- Position: fixed, full viewport
- Background: `color.background.primary` at 80% opacity
- Backdrop filter: blur(4px)
- Z-index: above everything including AppHeader
- Click behavior: does NOT close modal
  Reason: accidental overlay clicks are too likely on a consequential action
  User must explicitly choose "Keep Trip" or "Cancel Anyway"

**Modal card:**
- Position: centered in viewport, both axes
- Width: 480px fixed
- Max-width: calc(100vw - 48px) — safe on smaller viewports
- Background: `color.surface.elevated` (#323234)
- Border: 1px `color.outline.default`
- Border radius: `radius.lg` (16px)
- Padding: `spacing.6` (32px)
- Box shadow: none — elevation via color tint, not shadow

**Card internal layout:**
```
┌─────────────────────────────────────────┐
│  Cancel your trip?                      │  ← title
│                                         │
│  Cancelling will return your            │  ← body
│  co-riders to the waiting queue.        │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Priya K. │  │ Rohan S.             │ │  ← co-rider chips
│  └──────────┘  └──────────────────────┘ │
│                                         │
│  [Keep Trip]        [Cancel Anyway]     │  ← action row
└─────────────────────────────────────────┘
```

**Title:**
- Text: "Cancel your trip?"
- Font: `typography.headline` (22px DM Sans 600)
- Color: `color.text.primary`
- Margin bottom: `spacing.4` (16px)

**Body text:**
- Text: "Cancelling will return your co-riders to the waiting queue."
- Font: `typography.body_large` (16px DM Sans 400)
- Color: `color.text.secondary`
- Margin bottom: `spacing.4` (16px)

**Co-rider chips:**
- One chip per co-rider (excludes current user)
- Chip background: `color.surface.container`
- Chip border: 1px `color.outline.default`
- Chip radius: `radius.full` (pill)
- Chip padding: `spacing.1` (4px) vertical, `spacing.3` (12px) horizontal
- Chip text: first name + last initial, `typography.label` (13px DM Sans 500)
- Chip color: `color.text.secondary`
- Chips display: flex, wrap, gap `spacing.2` (8px)
- Margin below chips: `spacing.6` (32px)

**Action row:**
- Display: flex, gap `spacing.3` (12px)
- Two buttons side by side

**"Keep Trip" button (LEFT — primary action):**
- This is intentionally the LEFT button
- Visual weight: PrimaryButton spec (filled, accent)
- Label: "Keep Trip"
- Width: 50% minus half gap
- This placement is deliberate — primary action on left
  matches reading direction, user reaches it first

**"Cancel Anyway" button (RIGHT — destructive):**
- Visual weight: DestructiveButton spec (outlined, error color)
- Label: "Cancel Anyway"
- Width: 50% minus half gap

**Why "Keep Trip" is the primary button:**
The modal exists to create friction for cancellation.
Making "Keep Trip" the visually dominant button means
the path of least resistance is NOT cancelling.
A user who tapped Cancel Trip by accident will naturally
click the prominent button — which keeps the trip intact.
This protects co-riders from accidental cancellations.

## Keyboard Behavior
- ESC key: does NOT close modal
  Reason: same as overlay click — too easy to accidentally dismiss
  User must use "Keep Trip" button to close without cancelling
- Tab: cycles through "Keep Trip" → "Cancel Anyway" → "Keep Trip"
- Enter on focused button: activates that button
- Initial focus: "Keep Trip" button receives focus on modal open
  Reason: safest default — Enter key keeps the trip

## Focus Trap
While modal is open:
- Tab cannot leave the modal
- Focus cannot reach elements behind the overlay
- Implement with focus-trap pattern or inert attribute on background

## Accessibility Rules
- Modal container: `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` points to title element id
- `aria-describedby` points to body text element id
- On open: focus moves to "Keep Trip" button
- On close: focus returns to "Cancel Trip" button that opened it
- Overlay: `aria-hidden="true"` — not a meaningful element
- Co-rider chips: `aria-label="Co-rider: {name}"` each

## Animation Rules

**Opening sequence:**
1. Overlay: opacity 0→1, 200ms `motion.easing.standard`
2. Card: simultaneously with overlay
   opacity 0→1, scale 0.95→1.0
   Duration: 300ms `motion.easing.expressive` (slight spring)
   The spring on card entrance signals: "pay attention to this"

**Closing sequence (Keep Trip):**
1. Card: opacity 1→0, scale 1.0→0.97, 200ms `motion.easing.accelerate`
2. Overlay: opacity 1→0, 200ms `motion.easing.accelerate`
   Simultaneous with card exit

**Closing sequence (Cancel Anyway):**
1. Modal closes same as above
2. After close: app dispatches cancel API call
3. On success: RESET action, navigate to Home
4. Loading state during API call: "Cancel Anyway" button
   enters loading state (spinner), "Keep Trip" disabled

## Token Usage Summary
```
color.background.primary    → overlay background base
color.surface.elevated      → modal card background
color.surface.container     → co-rider chip background
color.outline.default       → card border, chip border
color.text.primary          → title
color.text.secondary        → body text, chip text
typography.headline         → modal title (22px DM Sans 600)
typography.body_large       → body text (16px DM Sans 400)
typography.label            → chip text (13px DM Sans 500)
radius.lg                   → card border radius
radius.full                 → chip border radius
spacing.6                   → card padding, below-chips margin
spacing.4                   → title margin, body margin
spacing.3                   → action button gap, chip padding horizontal
spacing.2                   → chip gap
spacing.1                   → chip padding vertical
motion.duration.standard    → overlay fade
motion.easing.expressive    → card entrance spring
motion.easing.accelerate    → exit animation
```

---

---

# SkeletonBlock

## Purpose
Placeholder shown while Trip screen data is loading.
Replaces actual content with approximate shape placeholders
that shimmer — communicating "content is coming" without
showing broken or empty states.

Used on Trip screen only — the only screen where data
arrives after the screen renders.

All other screens either:
- Have data before rendering (Summary, Home)
- Don't need data to render their core content (Waiting, UserSelector)

## Variants
- `text` — replaces a line of text
- `title` — replaces a larger heading or data number
- `card` — replaces an entire card component
- `circle` — replaces an avatar or dot element

## The Shimmer Effect
All variants share the same shimmer animation.

Base color: `color.surface.container` (#2A2A2C)
Shimmer highlight: `color.surface.elevated` (#323234)

The highlight travels left to right across the skeleton shape.
Implementation: CSS linear-gradient animated via background-position.

```
background: linear-gradient(
  90deg,
  color.surface.container 25%,
  color.surface.elevated 50%,
  color.surface.container 75%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite linear;
```

Duration: 1500ms (slower than typical — calmer feeling)
Easing: linear (consistent travel speed)
Direction: left to right always

## Variant Specifications

**text variant:**
- Height: 14px
- Border radius: `radius.xs` (4px)
- Width: variable — passed as prop (e.g. "60%", "80%", "100%")
- Use for: co-rider names, stop addresses, metadata labels

**title variant:**
- Height: 36px
- Border radius: `radius.xs` (4px)
- Width: variable — typically "40%" for data numbers, "70%" for headings
- Use for: fare amount placeholder, ETA placeholder

**card variant:**
- Height: variable — matches the card it replaces
- Border radius: matches the card's radius token
  FareHeroCard: `radius.lg` (16px)
  PassengerRow container: `radius.md` (12px)
- Width: 100% of parent
- Use for: entire card placeholders before data arrives

**circle variant:**
- Width = Height (square, border-radius makes it circle)
- Size: passed as prop — default 32px (matches PassengerRow avatar)
- Border radius: `radius.full` (9999px)
- Use for: passenger avatars

## Trip Screen Skeleton Layout
This is the specific skeleton structure for the Trip screen.

```
┌──────────────────────┐  ┌─────────────────────────┐
│  [card skeleton]     │  │  [card skeleton]         │  ← FareHeroCard + ETAHeroCard
│  96px height         │  │  96px height             │
└──────────────────────┘  └─────────────────────────┘

[card skeleton — 320px height]                          ← Map placeholder

[card skeleton — 180px height]                          ← RouteTimeline placeholder

┌────────────────────────────────────────────────────┐
│  [circle 32px]  [text 40%]          [title 20%]   │  ← PassengerRow placeholder
│  ─────────────────────────────────────────────── │
│  [circle 32px]  [text 35%]          [title 20%]   │
└────────────────────────────────────────────────────┘

[text 30%]    [text 25%]                                ← TripMetaRow placeholder
```

## Skeleton-to-Content Transition
When data arrives:
- Skeleton fades out: opacity 1→0, 150ms
- Real content fades in: opacity 0→1, 200ms
- Gap between: 50ms
- No layout shift — skeleton shapes approximate real content dimensions

**Why approximation matters:**
If skeleton is 80px tall but real content is 120px,
the layout shifts on load — jarring.
Skeleton dimensions must closely match real content dimensions.
The specs above are calibrated to match actual component heights.

## Accessibility Rules
- Container: `aria-busy="true"` while loading
- Container: `aria-label="Loading trip details"`
- Individual skeleton blocks: `aria-hidden="true"`
  Screen readers get the container label, not individual shapes
- When content loads: `aria-busy="false"`, label removed

## Animation Rules
- Shimmer: continuous, 1500ms linear infinite
- Pause when: `prefers-reduced-motion` is set
  If reduced motion: static skeleton color, no shimmer
  Content still loads and replaces skeleton normally
- Entrance: skeleton appears instantly with the screen
  No fade-in for skeleton — it should feel immediate

## Token Usage Summary
```
color.surface.container     → skeleton base color
color.surface.elevated      → shimmer highlight color
radius.xs                   → text + title skeleton radius
radius.full                 → circle skeleton radius
radius.lg                   → card skeleton (FareHeroCard size)
radius.md                   → card skeleton (standard card size)
```

---

---

# AnimatedRouteLine

## Purpose
The visual core of the Waiting screen.
Two dots connected by a dashed line with animated dashes
traveling from pickup to drop — continuously looping.

Its job: make the wait feel active, not broken.
It communicates "the system is working between your two points"
without using a spinner, progress bar, or loading text.

This component has three states that correspond to the
three emotional moments of the Waiting screen:
1. Searching — looping animation (normal state)
2. Matched — accelerate + converge + flash (the payoff)
3. Idle — static, no animation (before request exists)

## Why This Animation And Not A Spinner

A spinner says: "something is happening, I don't know what."
This animation says: "we are connecting your pickup to your drop."

The animation is specific to the product.
It tells the story of what matching actually does.
An interviewer sees it and immediately understands
it was designed for this app — not pulled from a library.

## Variants
- `searching` — active looping state, PENDING request exists
- `matched` — transition state, match found
- `idle` — static, no animation

## SVG Structure
The component renders as an SVG element.

```
SVG viewBox: "0 0 400 80"

Left dot (pickup):   cx=40,  cy=40, r=6
Right dot (drop):    cx=360, cy=40, r=6
Dashed line:         x1=52, y1=40, x2=348, y2=40
                     stroke-dasharray="8 6"
                     (8px dash, 6px gap)
```

The line starts at the edge of the left dot (40+12=52)
and ends at the edge of the right dot (360-12=348).
Dots and line never overlap.

## Searching State (Normal Loop)

**Dots:**
- Fill: `color.accent.primary` (#5EBFAD)
- Radius: 6px
- No animation on dots in searching state — stable anchors

**Dashed line:**
- Stroke: `color.accent.primary` at 60% opacity
- Stroke-width: 2px
- Stroke-dasharray: "8 6" (8px dash, 6px gap)
- Animation: stroke-dashoffset decreasing
  Total dash pattern length: 14px (8+6)
  stroke-dashoffset animates from 14 to 0, then repeats
  This moves dashes from left to right continuously

**Animation spec:**
- Property: stroke-dashoffset
- From: 14 (one full pattern length)
- To: 0
- Duration: 1800ms
- Easing: linear
- Iteration: infinite
- Direction: normal (always left to right — pickup toward drop)

**Card container:**
- Background: `color.surface.default` with `color.accent.dim` overlay
  Implementation: surface.default background +
  accent.dim as a pseudo-element or second background layer
- Border: 1px `color.outline.default`
- Radius: `radius.lg` (16px)
- Padding: `spacing.6` (32px) horizontal, `spacing.5` (20px) vertical
- Width: full content column

**Address labels below dots:**
- Left label: pickup address (trimmed to first segment)
  Position: below left dot, left-aligned with dot center
- Right label: drop address (trimmed to first segment)
  Position: below right dot, right-aligned with dot center
- Font: `typography.caption` (11px DM Sans 400)
- Color: `color.text.tertiary`
- Top margin: `spacing.2` (8px) below SVG

## Matched State (The Payoff)

This is the emotional peak of the entire app.
Three things happen in sequence over 800ms total.

**Phase 1 — Accelerate (0ms to 300ms):**
Dash animation speed increases from 1800ms to 400ms per cycle.
Transition: animation-duration property changes over 300ms.
Both dots begin scaling up slightly: scale 1→1.1, 300ms
Dot fill brightens: opacity increases to 100% (from 60% on line)
Line stroke-opacity increases to 100%

**Phase 2 — Converge (300ms to 600ms):**
Left dot moves right: cx from 40 to 200 (center)
Right dot moves left: cx from 360 to 200 (center)
Both move simultaneously
Easing: `motion.easing.expressive` (slight spring — they "snap" together)
Duration: 300ms
Dashes continue animating during convergence

**Phase 3 — Flash and resolve (600ms to 800ms):**
Dots merge at center (cx=200)
Single merged dot: radius expands from 6 to 16px, 100ms
Entire SVG area: brief flash of `color.accent.primary` at 30% opacity
  Implementation: white/accent overlay on card, opacity 0→0.3→0, 200ms
Line fades out: opacity 1→0, 150ms
Merged dot holds for 100ms at full size

**After 800ms:**
Screen transition begins (Trip screen fades in)
AnimatedRouteLine fades out with screen

**Why convergence tells the story:**
Two separate points finding each other is literally
what batch matching does — it finds two people going
the same direction and connects them.
The animation physically shows this moment.
No other loading animation in any app does this
because no other app has this specific product logic.

## Idle State
- Both dots rendered at `color.text.tertiary`
- Line rendered at `color.outline.subtle`
- No animation
- No shimmer
- Used when: component mounts before request exists
  (brief moment during app initialization)

## Reduced Motion Behavior
If `prefers-reduced-motion` is set:

**Searching state:**
- Dashes do not animate (static dashed line)
- Dots pulse gently: opacity 0.7→1→0.7, 2000ms, infinite
  This is much gentler than the dash animation
  Still communicates "alive" without movement

**Matched state:**
- Skip phases 1 and 2 entirely
- Jump directly to phase 3 flash (simplified):
  Card background flashes accent_dim once, 200ms
  Then screen transition begins
- No convergence animation

## Component Dimensions (Desktop)
- SVG width: 100% of card content area
- SVG height: 80px fixed
- Card total height: approximately 140px
  (SVG 80px + labels ~20px + padding top/bottom 40px)
- This matches the skeleton card placeholder height in SkeletonBlock spec

## Accessibility Rules
- SVG: `role="img"`
- SVG: `aria-label="Searching for a matching ride between {pickup} and {drop}"`
- Matched state: `aria-label` updates to "Match found"
  Update fires via `aria-live="polite"` on parent
- All SVG child elements: `aria-hidden="true"`
  The SVG label provides all needed context
- Animation: respects `prefers-reduced-motion` as specified above

## Implementation Note For Developer
The matched state animation has three phases with precise timing.
Use a state machine approach — not nested setTimeout calls.

Recommended pattern:
```
type AnimationState = 'idle' | 'searching' | 'accelerating' |
                      'converging' | 'flashing' | 'complete'
```

Each state transition is triggered by either:
- A timer (phases are time-based)
- An external prop change (searching→matched triggered by parent)

This keeps the animation logic predictable and debuggable.
If you use nested setTimeouts, you will create race conditions
when the component unmounts during animation.
Always clear timers in cleanup.

## Token Usage Summary
```
color.accent.primary        → dots fill, line stroke (searching)
color.accent.dim            → card background overlay
color.surface.default       → card base background
color.outline.default       → card border
color.text.tertiary         → address labels, idle dot color
color.outline.subtle        → idle line color
radius.lg                   → card border radius
spacing.6                   → card horizontal padding
spacing.5                   → card vertical padding
spacing.2                   → SVG-to-labels gap
typography.caption          → address labels
motion.easing.expressive    → dot convergence spring
```

---

## Part 5 Complete — Component Library Done

**3 components specified:**
CancelModal · SkeletonBlock · AnimatedRouteLine

---

## Complete Component Library Summary

```
Part 1 — Foundation + Inputs
  AppHeader
  Divider
  NotificationBanner
  LocationInputCard
  LocationInputRow
  DateTimeRow
  AutocompleteDropdown

Part 2 — Display
  GreetingBlock
  FareHeroCard
  SavingsHeroCard
  StatusBadge
  ElapsedTimer
  RotatingQuote

Part 3 — Actions + Navigation
  UserCard
  PrimaryButton
  DestructiveButton
  SecondaryButton
  TextButton

Part 4 — Trip Anatomy
  RouteTimeline
  RouteStopItem
  PassengerRow
  TripMetaRow

Part 5 — Overlays + Animation
  CancelModal
  SkeletonBlock
  AnimatedRouteLine
```

**Total: 23 components.**
Every one derived from your actual screens.
None from a generic component library list.

---

## What You Now Have — Complete Picture

```
✅ theme-tokens.json              — all design values
✅ screen-specifications.md       — all 5 screens
✅ components-part1 through 5     — all 23 components
⬜ CSS custom properties file     — bridges tokens to code
```

One file remaining before implementation begins.
