# CarpoolTU Component Specs — Part 4
## Trip Anatomy Components
**Token Reference:** theme-tokens.json
**Rule:** Every value references a token name, never a raw hex.

---

## The Challenge These Components Solve

The Trip screen has the highest information density in the app.
Stops, passengers, fare, ETA, distance, detour — all on one screen.

The risk: it feels like a data table. Clinical. Overwhelming.

These four components solve that by creating clear visual hierarchy
through three tools: typography scale, color tiers, and spacing rhythm.

The user should be able to scan the Trip screen in 3 seconds and know:
1. What they're paying
2. Where they're going
3. Who they're with

Everything else is secondary context.

---

---

# RouteTimeline

## Purpose
Shows the complete ordered stop sequence for the trip.
Lives on the Trip screen between the hero cards and the passenger list.

Its job is to answer: "where does the car go, and where am I in that sequence?"

Uses the 3-tier visual system to make the user's position
immediately obvious without hiding the full route context.

## Variants
- `active` — trip is in progress, used on Trip screen
- `completed` — trip is done, used on Summary screen
  Completed variant: all stops rendered in tier 2 (neutral)
  No highlighting — journey is over, no current position

## The 3-Tier System

**Tier 1 — Your stops (highlighted)**
- Stop dot: 12px filled circle, `color.accent.primary`
- Stop label: `typography.body` (15px DM Sans 400), `color.text.primary`
- Stop type tag: "Your pickup" / "Your drop"
  Font: `typography.caption` (11px DM Sans 500)
  Color: `color.accent.primary`
  Background: `color.accent.dim`
  Radius: `radius.full` (pill)
  Padding: `spacing.1` (4px) vertical, `spacing.2` (8px) horizontal
- Connector line above/below: `color.accent.primary` at 60% opacity

**Tier 2 — Stops after yours (neutral)**
- Stop dot: 10px filled circle, `color.text.secondary`
- Stop label: `typography.body` (15px DM Sans 400), `color.text.secondary`
- Stop type tag: not shown — these stops are context, not instruction
- Connector line: `color.outline.default`

**Tier 3 — Stops before yours (dimmed)**
- Stop dot: 8px circle, outline only, `color.text.tertiary`
- Stop label: `typography.caption` (11px DM Sans 400), `color.text.tertiary`
- Stop type tag: not shown
- Connector line: `color.outline.subtle`
- Entire row opacity: 0.6

## Why Dot Sizes Differ Across Tiers
Size reinforces tier without relying on color alone.
Tier 1: 12px — largest, most prominent
Tier 2: 10px — standard, readable
Tier 3: 8px — smallest, receded
This means the visual hierarchy survives grayscale and low-contrast conditions.

## Layout Rules

```
  ○ ─ ─  Rohan pickup         ← tier 3 (before you, dimmed)
  │
  ●      Your pickup          ← tier 1 (your stop, highlighted)
  │      [Your pickup]        ← tier tag, accent pill
  │
  ●      Your drop            ← tier 1 (your stop, highlighted)
  │      [Your drop]          ← tier tag, accent pill
  │
  ●      Rohan drop           ← tier 2 (after you, neutral)
```

- Component container: full content column width
- Container background: `color.surface.default`
- Container border: 1px `color.outline.default`
- Container radius: `radius.md` (12px)
- Container padding: `spacing.4` (16px) all sides

- Each stop row: minimum 48px height
  Rows with tier tags: minimum 60px height
- Left column: dot + connector line, 24px wide, fixed
- Right column: stop content, remaining width
- Gap between left and right columns: `spacing.3` (12px)

**Connector line:**
- Width: 1px
- Centered under dot horizontally
- Runs from bottom of current dot to top of next dot
- Last stop: no connector line below
- First stop: no connector line above

**Stop address display:**
Full address from `stop.address` field.
If address is null: fallback to `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`
Max 2 lines — overflow ellipsis on second line.

## Completed Variant (Summary Screen)
All stops render at tier 2 visual level.
No tier 1 highlighting — the journey is complete.
No tier tags.
Component background: transparent on Summary screen.
This creates visual distinction between Trip screen
(active, highlighted) and Summary screen (resolved, neutral).

## Accessibility Rules
- Container: `role="list"`, `aria-label="Trip route"`
- Each stop: `role="listitem"`
- Your stops: `aria-label="Your {type}: {address}"`
- Other stops: `aria-label="{type}: {address}"`
- Tier 3 stops: `aria-label="Earlier stop: {address}"`
- Connector lines: `aria-hidden="true"` — decorative

## Animation Rules
**Active variant entrance (Trip screen):**
- Stops stagger in from top to bottom
- Each stop: opacity 0→1, translateY(6px)→0
- Delay between stops: 50ms
- Duration per stop: `motion.duration.standard` (300ms)
- Easing: `motion.easing.decelerate`
- Your tier 1 stops animate last in the stagger
  Then pulse once: scale 1→1.04→1, 400ms
  This draws the eye to your position in the route

**Completed variant (Summary screen):**
- No stagger — all stops fade in together
- Opacity 0→1, 300ms
- No pulse — journey is done, no need to draw attention

## Token Usage Summary
```
color.accent.primary        → tier 1 dot, label, tag text, connector
color.accent.dim            → tier 1 tag background
color.text.primary          → tier 1 address label
color.text.secondary        → tier 2 dot, address label
color.text.tertiary         → tier 3 dot, address label
color.outline.default       → tier 2 connector, container border
color.outline.subtle        → tier 3 connector
color.surface.default       → container background (active variant)
typography.body             → tier 1 + tier 2 address (15px DM Sans 400)
typography.caption          → tier 3 address + tier tags (11px DM Sans)
radius.md                   → container radius
radius.full                 → tier tag pill radius
spacing.4                   → container padding
spacing.3                   → dot-to-content gap
spacing.1                   → tier tag vertical padding
spacing.2                   → tier tag horizontal padding
motion.duration.standard    → stop entrance
motion.easing.decelerate    → stop entrance easing
```

---

---

# RouteStopItem

## Purpose
Single row inside RouteTimeline.
Renders one stop with correct tier treatment based on
its position relative to the current user's stops.

This is the atomic unit of the route display.
RouteTimeline composes multiple RouteStopItems.

## Variants
- `tier-1` — current user's stop (pickup or drop)
- `tier-2` — stop after user's last stop
- `tier-3` — stop before user's first stop

## Tier Determination Logic
The parent RouteTimeline passes each stop a `tier` prop.
The tier is computed in the parent, not the item itself.

Computation rule:
```
Find index of user's first stop (their pickup)
Find index of user's last stop (their drop)

For each stop:
  if stopOrder < userPickupOrder → tier 3
  if stopOrder === userPickupOrder OR stopOrder === userDropOrder → tier 1
  if stopOrder > userDropOrder → tier 2
```

This logic lives in a utility function, not in the component.

## States
RouteStopItem has no interactive states on Trip screen.
It is display-only.

Exception: on a future iteration where stops are tappable
to show on map — but that is out of scope for current implementation.

## Layout Rules

**Tier 1 layout:**
```
[12px filled dot]  [address text]          [tier tag pill]
                   [                    ]
```
- Dot: 12px circle, `color.accent.primary`, filled
- Address: `typography.body` (15px DM Sans 400), `color.text.primary`
- Tier tag: right-aligned, pill shape
  "Your pickup" or "Your drop"
  Font: `typography.caption` (11px DM Sans 500)
  Color: `color.accent.primary`
  Background: `color.accent.dim`
  Radius: `radius.full`
  Padding: `spacing.1` vertical, `spacing.2` horizontal
- Row min-height: 60px (taller to accommodate tag)
- Row display: flex, align-items: center

**Tier 2 layout:**
```
[10px filled dot]  [address text]
```
- Dot: 10px circle, `color.text.secondary`, filled
- Address: `typography.body` (15px DM Sans 400), `color.text.secondary`
- No tag
- Row min-height: 48px

**Tier 3 layout:**
```
[8px outline dot]  [address text]
```
- Dot: 8px circle, outline only (1px border), `color.text.tertiary`
- Address: `typography.caption` (11px DM Sans 400), `color.text.tertiary`
- No tag
- Row opacity: 0.6
- Row min-height: 40px (shorter — less visual weight)

## Connector Line Rules
Rendered by RouteTimeline, not RouteStopItem.
RouteStopItem only renders the dot and content.
This separation keeps the component clean and avoids
connector line positioning complexity inside the item.

## Accessibility Rules
- `role="listitem"` (set by parent)
- Tier 1: `aria-label="Your {stopType}: {address}"`
  stopType: "pickup" or "drop-off"
- Tier 2: `aria-label="Stop: {address}"`
- Tier 3: `aria-label="Earlier stop: {address}"`
- Tier tag: `aria-hidden="true"` — information already in aria-label

## Animation Rules
Managed by parent RouteTimeline stagger.
RouteStopItem itself has no self-managed animation.

**Tier 1 specific:**
After stagger entrance, tier 1 items pulse once:
scale 1→1.04→1, 400ms, `motion.easing.expressive`
This is the only component-level animation RouteStopItem triggers.

## Token Usage Summary
```
color.accent.primary        → tier 1 dot + tag text + connector
color.accent.dim            → tier 1 tag background
color.text.primary          → tier 1 address
color.text.secondary        → tier 2 dot + address
color.text.tertiary         → tier 3 dot + address
typography.body             → tier 1 + tier 2 address
typography.caption          → tier 3 address + tier 1 tag
radius.full                 → tier tag pill
spacing.1                   → tag vertical padding
spacing.2                   → tag horizontal padding
motion.easing.expressive    → tier 1 entrance pulse
```

---

---

# PassengerRow

## Purpose
Single row in the "Sharing with" section on Trip screen.
Shows one co-rider — their name and their fare share.

Plural PassengerRows compose the passenger list section.
This component is purely informational — no interaction.

## Variants
- `co-rider` — another passenger in the trip
  This is the only variant rendered in the list.
  The current user is NOT shown in the passenger list.
  Reason: the user already sees their own fare in FareHeroCard.
  Showing themselves again in the list creates redundancy.

## States
Display only. No interactive states.

## Layout Rules

```
┌────────────────────────────────────────────────────┐
│  [initial]   Rohan S.                    ₹47.40   │
└────────────────────────────────────────────────────┘
```

- Row height: 48px
- Row padding: `spacing.4` (16px) horizontal
- Row background: transparent (inherits container)
- Display: flex, align-items: center, justify-content: space-between

**Left side — passenger identity:**
- Initial avatar: 32px circle
  Background: `color.surface.container`
  Border: 1px `color.outline.default`
  Initial letter: `typography.title` (17px DM Sans 500), `color.text.secondary`
  Only first initial of first name — never full name initial
- Gap between avatar and name: `spacing.3` (12px)
- Name: first name + last initial only
  Format: "Rohan S." — never full last name
  Font: `typography.body` (15px DM Sans 400)
  Color: `color.text.primary`

**Right side — fare:**
- Amount: formatted as "₹{amount}"
  Font: `typography.data_large` (24px DM Mono 400)
  Color: `color.text.secondary`
  Reason: their fare is context, not primary info
  The user's own fare (in FareHeroCard) uses accent color
  Co-rider fares use secondary text — same data, lower priority

**Between rows:**
- Divider: `inset` variant (16px left indent)
- This indent aligns the divider with the name, not the avatar
- Creates cleaner visual grouping

## Why First Name + Last Initial Only
Full names are unnecessary in a university context — everyone is
roughly peers. First name + initial provides enough identification
to distinguish two "Rohans" without exposing full identity.
This is a deliberate privacy-respecting choice.

## Container (parent element, not the row itself)
- Background: `color.surface.default`
- Border: 1px `color.outline.default`
- Radius: `radius.md` (12px)
- Padding: 0 (rows handle their own padding)
- Section label above container: "Sharing with"
  Font: `typography.label` (13px DM Sans 500)
  Color: `color.text.tertiary`
  Letter-spacing: 0.02em
  Margin bottom: `spacing.2` (8px)

## Empty State
If passengers array has only current user (solo trip — should not happen):
Container shows: "Solo trip" centered
Font: `typography.body`, `color.text.tertiary`
This state should never occur in normal flow but must be handled.

## Accessibility Rules
- Container: `role="list"`, `aria-label="Co-riders"`
- Each row: `role="listitem"`
- Row `aria-label`: "{name}, fare share ₹{amount}"
- Avatar initial: `aria-hidden="true"` — name provides the label
- Dividers: `aria-hidden="true"`

## Animation Rules
- Rows stagger in with RouteTimeline on Trip screen entrance
- Same stagger system: 50ms delay, 300ms duration, decelerate easing
- Passenger rows stagger after route stops complete
  Additional base delay: 200ms after last route stop appears

## Token Usage Summary
```
color.surface.default       → container background
color.surface.container     → avatar background
color.outline.default       → container border, avatar border, divider
color.text.primary          → passenger name
color.text.secondary        → fare amount, avatar initial
color.text.tertiary         → section label, empty state
typography.body             → passenger name (15px DM Sans 400)
typography.title            → avatar initial (17px DM Sans 500)
typography.data_large       → fare amount (24px DM Mono 400)
typography.label            → section label (13px DM Sans 500)
radius.md                   → container radius
spacing.4                   → row horizontal padding
spacing.3                   → avatar-to-name gap
spacing.2                   → section label margin, avatar size context
motion.duration.standard    → row entrance
motion.easing.decelerate    → row entrance easing
```

---

---

# TripMetaRow

## Purpose
Shows supplementary trip data — total distance and detour ratio.
Lives below the passenger list on Trip screen.
Also appears on Summary screen in a slightly different arrangement.

This is the lowest-priority information on both screens.
It answers "is this route reasonable?" — a secondary concern
after fare and ETA are already known.

## Variants
- `trip` — used on Trip screen, horizontal two-item layout
- `summary` — used on Summary screen, includes completion time

## States
Display only. No interactive states.

## Layout Rules — trip variant

```
Total distance    8.4 km      ·      12% detour · saves ₹47
```

- Display: flex, align-items: center, gap `spacing.4` (16px)
- Separator: "·" character, `color.text.tertiary`
- No card, no background — text directly on screen

**Distance item:**
- Label: "Total distance"
  Font: `typography.label` (13px DM Sans 500)
  Color: `color.text.tertiary`
- Value: "8.4 km"
  Font: `typography.data_large` (24px DM Mono 400)
  Color: `color.text.secondary`
- Label and value stacked vertically, gap `spacing.1` (4px)

**Detour item:**
- Label: "Detour"
  Font: `typography.label` (13px DM Sans 500)
  Color: `color.text.tertiary`
- Value: "12%"
  Font: `typography.data_large` (24px DM Mono 400)
  Color: `color.text.secondary`
- Sub-value: "· saves ₹{amount} vs solo"
  Font: `typography.caption` (11px DM Sans 400)
  Color: `color.text.tertiary`
  Inline with value, gap `spacing.1` (4px)
  Only shown if savings > 0

**The detour + savings pair rule:**
Never show detour without savings context.
A 12% detour alone sounds bad.
"12% detour · saves ₹47 vs solo" sounds like a good deal.
If savings cannot be computed: show detour percentage only, omit sub-value.

## Layout Rules — summary variant

```
8.4 km travelled   ·   3 stops   ·   24 minutes   ·   Completed 6:42 PM
```

- Single horizontal row, all items inline
- Separator: "·" character between each item
- Font: `typography.body` (15px DM Sans 400)
- Color: `color.text.secondary`
- All items same visual weight — no hierarchy needed
  On Summary screen the savings card carries the hierarchy,
  this row is just confirming facts

## Accessibility Rules
- `role="region"`, `aria-label="Trip details"`
- Each data pair: not individually labelled — the text is self-describing
- Separator dots: `aria-hidden="true"`

## Animation Rules
- Trip variant: fades in after PassengerRow stagger completes
  Opacity 0→1, 200ms, `motion.easing.standard`
  No translateY — lowest priority content enters without movement
- Summary variant: fades in as part of screen entrance sequence
  Same 200ms fade, no movement

## Token Usage Summary
```
color.text.primary          → not used in this component
color.text.secondary        → data values
color.text.tertiary         → labels, separators, sub-values
typography.label            → item labels (13px DM Sans 500)
typography.data_large       → item values (24px DM Mono 400)
typography.body             → summary variant text (15px DM Sans 400)
typography.caption          → savings sub-value (11px DM Sans 400)
spacing.4                   → gap between items
spacing.1                   → label-to-value gap, value-to-subvalue gap
motion.duration.standard    → entrance fade
motion.easing.standard      → entrance easing
```

---

## Part 4 Complete

**4 components specified:**
RouteTimeline · RouteStopItem · PassengerRow · TripMetaRow

**The system these four form together on the Trip screen:**

```
[FareHeroCard]  [ETAHeroCard]    ← answers the two anxieties
[Map]                            ← spatial grounding
[RouteTimeline]                  ← where does the car go
  [RouteStopItem tier-3]         ← before you, dimmed
  [RouteStopItem tier-1]         ← your pickup, highlighted
  [RouteStopItem tier-1]         ← your drop, highlighted
  [RouteStopItem tier-2]         ← after you, neutral
[PassengerRow × n]               ← who you're sharing with
[TripMetaRow]                    ← confirming details
[PrimaryButton] [DestructiveButton] ← actions
```

Information flows from highest anxiety (fare) to lowest (metadata).
A user scanning top to bottom gets answers in order of importance.

**Key decisions you can explain:**

1. Why tier sizes differ (12px / 10px / 8px) — not just color
2. Why co-rider fares use secondary color not accent
3. Why the current user is NOT in the passenger list
4. Why detour is never shown without savings context
5. Why TripMetaRow has no translateY on entrance

**Part 5 is the final part:**
CancelModal · SkeletonBlock · AnimatedRouteLine

These three are the most technically interesting components in the system.
AnimatedRouteLine is the Waiting screen's core visual.
CancelModal is the only true modal in the entire app.
SkeletonBlock is the loading system used across Trip screen.

Ready when you are.

