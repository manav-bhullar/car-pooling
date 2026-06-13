# CarpoolTU Component Specs — Part 3
## Actions + Navigation
**Token Reference:** theme-tokens.json
**Rule:** Every value references a token name, never a raw hex.

---

## The Button Hierarchy — Read First

Before individual specs, understand the system they form together.

Every screen has a maximum of ONE filled button visible at a time.
This is not a suggestion — it is a rule.

The moment you put two filled buttons on the same screen, the user
cannot tell which action matters more. Visual weight collapses.

The three button types form a deliberate hierarchy:

```
PrimaryButton    (filled)     → the one thing the user should do
SecondaryButton  (outlined)   → an available alternative
TextButton       (text only)  → always accessible, never competing
DestructiveButton             → special case, outlined in error color
```

On Trip screen:
  Complete Trip → PrimaryButton (filled, accent)
  Cancel Trip   → DestructiveButton (outlined, error color)

On Waiting screen:
  Cancel Ride   → TextButton (text only, low visual weight)

On Home screen:
  Request Ride  → PrimaryButton (filled, accent)

On Summary screen:
  Book again    → SecondaryButton (outlined, accent) — NOT filled
  Reason: booking again should feel like an invitation, not a directive

---

---

# UserCard

## Purpose
Lives on the User Selector screen.
Each card represents one seeded user. Clicking it selects that user
and initializes the app session.

This is the first interactive element the user touches.
It must feel responsive and trustworthy immediately.

## Variants
- `default` — standard user card
- `selected` — brief selected state before navigation
  (visible for ~300ms during transition — confirms the tap registered)

## States

**default**
- Background: `color.surface.default`
- Border: 1px `color.outline.default`
- Radius: `radius.md` (12px)
- Text: name in `color.text.primary`, email in `color.text.tertiary`

**hover**
- Background: `color.surface.container`
- Border: 1px `color.outline.focus`
- Transform: `translateY(-2px)`
- Cursor: pointer
- Transition: 200ms `motion.easing.standard`
- Box shadow: none — elevation via border and transform only

**focus** (keyboard navigation)
- Border: 2px `color.outline.focus`
- Outline: 2px `color.outline.focus`, 2px offset, outside border
- Background: `color.surface.container`
- Transform: none — keyboard users do not get the lift effect
  Reason: translateY on focus causes layout shift for keyboard nav

**active/pressed**
- Background: `color.background.tertiary`
- Transform: `translateY(0)` — returns to baseline on press
- Scale: 0.98
- Transition: `motion.duration.instant` (100ms)

**selected** (post-click, pre-navigation)
- Border: 1px `color.accent.primary`
- Background: `color.accent.dim`
- Name color: `color.accent.primary`
- Duration: held for 300ms then navigation fires

## Layout Rules
- Width: 148px
- Height: 80px
- Padding: `spacing.4` (16px) all sides
- Display: flex, column, justify: center
- Name: `typography.title` (17px DM Sans 500), `color.text.primary`
- Email: `typography.caption` (11px DM Sans 400), `color.text.tertiary`
- Gap between name and email: `spacing.1` (4px)
- No avatar, no icon — name and email only
  Reason: avatars imply profile photos that don't exist in demo

## Accessibility Rules
- Element: `<button>` — not div, not anchor
- `aria-label="Continue as {name}"`
- `aria-pressed` reflects selected state
- Focus visible at all times — never suppress focus ring
- Cards arranged in grid: arrow key navigation between cards
  (implement with roving tabindex pattern)

## Animation Rules
- Hover lift: translateY transition 200ms `motion.easing.standard`
- Press return: translateY(0) + scale(0.98), 100ms instant
- Selected state: background + border color transition 200ms
- Grid stagger on page entrance:
  Each card fades in with translateY(8px)→0
  40ms delay between cards, left-to-right top-to-bottom
  Duration per card: `motion.duration.standard` (300ms)
  Easing: `motion.easing.decelerate`

## Token Usage Summary
```
color.surface.default       → default background
color.surface.container     → hover + focus background
color.background.tertiary   → pressed background
color.outline.default       → default border
color.outline.focus         → hover border, focus ring
color.accent.primary        → selected border, selected name
color.accent.dim            → selected background
color.text.primary          → name text
color.text.tertiary         → email text
typography.title            → name (17px DM Sans 500)
typography.caption          → email (11px DM Sans 400)
radius.md                   → card radius
spacing.4                   → card padding
spacing.1                   → name-to-email gap
motion.duration.instant     → press response
motion.duration.standard    → hover, selected transitions
motion.easing.standard      → hover transition
motion.easing.decelerate    → entrance stagger
```

---

---

# PrimaryButton

## Purpose
The single most important action on the current screen.
Filled with accent color — maximum visual weight.
Rule: only one PrimaryButton visible at a time on any screen.

Used on:
- Home screen: "Request Ride"
- Trip screen: "Complete Trip" (with two-stage confirmation)

## Variants
- `default` — standard filled button
- `confirming` — Complete Trip only, second-stage confirmation state

## States

**default — enabled**
- Background: `color.accent.primary` (#5EBFAD)
- Text: `color.text.on_accent` (#0D1F1C)
- Border: none
- Radius: `radius.sm` (8px)

**default — hover**
- Background: `color.accent.strong` (#4AAFA0)
- Transform: none — buttons do not lift
- Cursor: pointer
- Transition: 200ms `motion.easing.standard`

**default — focus**
- Background: `color.accent.primary`
- Outline: 2px `color.outline.focus`, 2px offset
- No background change on focus — outline is sufficient

**default — active/pressed**
- Background: `color.accent.strong`
- Scale: 0.98
- Transition: `motion.duration.instant` (100ms)

**default — disabled**
- Background: `color.accent.primary` at 30% opacity
- Text: `color.text.on_accent` at 30% opacity
- Cursor: not-allowed
- No hover/focus effects

**default — loading**
- Background: `color.accent.primary`
- Text replaced with: spinner icon (16px) + "Finding your ride..."
- Button disabled during loading
- Spinner: circular, `color.text.on_accent`, 1px stroke, rotates 360deg
  Duration: 800ms infinite linear

**confirming** (Complete Trip second stage)
- Background: `color.semantic.warning` (#F0A500)
  Shifts to amber — visually signals "this is different from before"
- Text: `color.text.on_accent`
- Label: "Confirm complete?"
- Icon: checkmark, left of text, 16px
- This state held for maximum 3 seconds
- If no second click within 3 seconds: returns to default state
  with 300ms transition back to accent color

## Layout Rules
- Height: 52px
- Width: context-dependent
  Home screen: full content column width
  Trip screen: 50% of content column minus half gap (side by side with DestructiveButton)
- Padding: `spacing.4` (16px) horizontal (only relevant when button has intrinsic width)
- Font: `typography.title` (17px DM Sans 500)
- Text alignment: center
- Display: flex, justify: center, align: center, gap `spacing.2` (8px) for icon
- Icon size: 16px, same color as text

## The Two-Stage Complete Trip Flow
Stage 1 (default state):
  Label: "Complete Trip"
  Icon: checkmark-circle outline

On first click:
  Background transitions to warning amber (300ms)
  Label changes to "Confirm complete?"
  Icon changes to checkmark-filled
  3-second countdown begins internally

On second click (within 3 seconds):
  Fires completeTrip API call
  Button enters loading state
  Label: "Completing..."

If no second click (3 seconds elapsed):
  Background transitions back to accent (300ms)
  Label returns to "Complete Trip"
  Icon returns to outline

On click elsewhere while confirming:
  Same reset as timeout

## Why This Pattern (Not A Modal)
A modal for trip completion would be disproportionate.
Trip completion only affects the current user's view.
The button-as-confirmation pattern:
- Requires intentional double action
- Provides clear visual feedback that something changed
- Does not interrupt the screen or block content
- Is a recognized Material pattern

## Accessibility Rules
- Element: `<button type="button">`
- `aria-label` updates with state:
  Default: "Complete trip"
  Confirming: "Confirm trip completion — click again to confirm"
  Loading: "Completing trip, please wait"
- `aria-disabled="true"` when disabled (not `disabled` attribute alone)
- `aria-busy="true"` during loading state
- Confirming state announced via `aria-live="polite"` on state change
- ESC key while confirming: resets to default state

## Animation Rules
- Hover background: 200ms `motion.easing.standard`
- Press scale: 100ms instant
- Default→confirming transition:
  Background color: 300ms `motion.easing.standard`
  Label crossfade: outgoing 150ms, incoming 150ms, 50ms gap
- Confirming→default reset:
  Same 300ms transition back
- Loading spinner: continuous rotation, 800ms per revolution, linear

## Token Usage Summary
```
color.accent.primary        → default background
color.accent.strong         → hover + pressed background
color.accent.dim            → disabled background base
color.semantic.warning      → confirming state background
color.text.on_accent        → button text all states
color.outline.focus         → focus ring
typography.title            → button label (17px DM Sans 500)
radius.sm                   → button radius (8px)
spacing.4                   → horizontal padding
spacing.2                   → icon-to-label gap
motion.duration.instant     → press response
motion.duration.standard    → hover + stage transitions
motion.easing.standard      → all transitions
```

---

---

# DestructiveButton

## Purpose
Cancel actions that have significant consequences.
Used on Trip screen only: "Cancel Trip"

Visually de-emphasized relative to PrimaryButton — outlined not filled.
The color signals danger without screaming it.

The visual hierarchy message:
PrimaryButton (filled accent) = "do this"
DestructiveButton (outlined error) = "this is available but think twice"

## Variants
Single variant. One job.

## States

**default**
- Background: transparent
- Border: 1px `color.semantic.error` (#FF453A)
- Text: `color.semantic.error`
- Radius: `radius.sm` (8px)

**hover**
- Background: `color.semantic.error_dim` (#FF453A15)
- Border: 1px `color.semantic.error`
- Text: `color.semantic.error`
- Transition: 200ms `motion.easing.standard`

**focus**
- Background: `color.semantic.error_dim`
- Outline: 2px `color.semantic.error`, 2px offset

**active/pressed**
- Background: `color.semantic.error` at 20% opacity
- Scale: 0.98
- Transition: `motion.duration.instant` (100ms)

**disabled**
- Border: 1px `color.semantic.error` at 30% opacity
- Text: `color.semantic.error` at 30% opacity
- Cursor: not-allowed

**loading** (during cancel API call)
- Border: 1px `color.semantic.error`
- Text replaced with spinner + "Cancelling..."
- Spinner: `color.semantic.error`, same spec as PrimaryButton spinner

## Layout Rules
- Height: 52px — matches PrimaryButton height exactly
- Width: 50% of content column minus half gap
  Sits side by side with PrimaryButton on Trip screen
- Font: `typography.title` (17px DM Sans 500)
- Text color: `color.semantic.error`
- Display: flex, justify: center, align: center

## Why Outlined Not Filled
A filled red button on the same screen as a filled teal button
creates two competing calls to action.
The user's eye bounces between them — decision paralysis.
Outlined red says: "this exists, but it's not what we recommend."

## Accessibility Rules
- Element: `<button type="button">`
- `aria-label="Cancel trip — this will affect your co-riders"`
  The label communicates consequence without requiring the user
  to read surrounding copy
- `aria-busy="true"` during loading
- Opens CancelModal on click — modal has its own accessibility spec

## Animation Rules
- Hover background wash: 200ms `motion.easing.standard`
- Press scale: 100ms instant
- No stage-based confirmation — DestructiveButton opens CancelModal instead
  Modal provides the friction, not the button itself

## Token Usage Summary
```
color.semantic.error        → border, text, all states
color.semantic.error_dim    → hover + focus background
color.outline.focus         → focus ring (uses error color here)
typography.title            → button label
radius.sm                   → button radius
motion.duration.instant     → press response
motion.duration.standard    → hover transition
motion.easing.standard      → hover transition
```

---

---

# SecondaryButton

## Purpose
Available alternative action. Present but not dominant.
Outlined with accent color — signals "this is a positive action"
without competing with PrimaryButton.

Used on:
- Summary screen: "Book another ride →"
- Any screen where a positive but non-primary action exists

## Variants
Single variant.

## States

**default**
- Background: transparent
- Border: 1px `color.accent.primary`
- Text: `color.accent.primary`
- Radius: `radius.sm` (8px)

**hover**
- Background: `color.accent.dim` (#5EBFAD20)
- Border: 1px `color.accent.primary`
- Text: `color.accent.primary`
- Transition: 200ms `motion.easing.standard`

**focus**
- Background: `color.accent.dim`
- Outline: 2px `color.outline.focus`, 2px offset

**active/pressed**
- Background: `color.accent.primary` at 20% opacity
- Scale: 0.98
- Transition: `motion.duration.instant` (100ms)

**disabled**
- Border: 1px `color.accent.primary` at 30% opacity
- Text: `color.accent.primary` at 30% opacity
- Cursor: not-allowed

## Layout Rules
- Height: 52px
- Width: full content column width on Summary screen
- Font: `typography.title` (17px DM Sans 500)
- Text color: `color.accent.primary`
- Display: flex, justify: center, align: center, gap `spacing.2` (8px)

## Why Not Filled On Summary Screen
The Summary screen's job is to affirm the completed trip.
A filled CTA at the bottom would create pressure to immediately book again.
Outlined says: "when you're ready, this is here."
The user just completed a trip — they should leave feeling satisfied,
not nudged into the next transaction.

## Accessibility Rules
- Element: `<button type="button">`
- `aria-label` describes the action fully: "Book another ride"
- If button contains an arrow icon: icon is `aria-hidden="true"`

## Animation Rules
- Hover background: 200ms `motion.easing.standard`
- Press scale: 100ms instant

## Token Usage Summary
```
color.accent.primary        → border, text all states
color.accent.dim            → hover + focus background
color.outline.focus         → focus ring
typography.title            → button label
radius.sm                   → button radius
spacing.2                   → icon-to-label gap
motion.duration.instant     → press response
motion.duration.standard    → hover transition
motion.easing.standard      → hover transition
```

---

---

# TextButton

## Purpose
Lowest visual weight action. Always accessible, never competing.
No border, no background — just text that behaves like a button.

Used on:
- Waiting screen: "Cancel Ride"
- Any low-stakes reversible action

## Variants
- `default` — standard text button
- `destructive` — text button for cancel/remove actions
  Uses error color instead of accent

## States — default variant

**default**
- Background: none
- Border: none
- Text: `color.accent.primary`
- Underline: none

**hover**
- Text: `color.accent.strong`
- Background: `color.accent.dim` tight around text
  (padding `spacing.1` horizontal, `spacing.1` vertical)
- Border radius: `radius.xs` (4px)
- Transition: 200ms

**focus**
- Outline: 2px `color.outline.focus`, 2px offset
- Background: `color.accent.dim`

**active/pressed**
- Text: `color.accent.strong`
- Scale: 0.97
- Transition: 100ms instant

**disabled**
- Text: `color.text.tertiary`
- Cursor: not-allowed

## States — destructive variant
Same as default but:
- Text: `color.semantic.error`
- Hover background: `color.semantic.error_dim`
- Hover text: `color.semantic.error`
- Focus outline: `color.semantic.error`

## Layout Rules
- Height: 40px (shorter than filled/outlined buttons — lower weight)
- Padding: `spacing.3` (12px) horizontal, `spacing.2` (8px) vertical
- Font: `typography.label` (13px DM Sans 500)
  Smaller than PrimaryButton — reinforces lower hierarchy
- Text color: variant-dependent
- No fixed width — intrinsic width only
- Alignment on Waiting screen: right-aligned within content column
  Reason: right alignment moves it away from the primary content
  Users who want to cancel must move their eye intentionally

## The Waiting Screen Cancel Position
Cancel Ride is right-aligned and below the fold initially.
At 3 minutes elapsed, it moves above the fold via scroll.
This is not hiding the button — it is not prioritizing it.
The button is always in the DOM and always reachable.

## Accessibility Rules
- Element: `<button type="button">` — never `<a>` without href
- `aria-label` if label alone is ambiguous:
  "Cancel Ride" is clear — no additional aria needed
- Minimum tap target: 40×40px — padding ensures this
- Focus visible at all times

## Animation Rules
- Hover background: 150ms `motion.easing.standard`
- Press scale: 100ms instant
- No entrance/exit animations — text buttons appear with their screen

## Token Usage Summary
```
color.accent.primary        → default variant text
color.accent.strong         → default variant hover text
color.accent.dim            → default variant hover background
color.semantic.error        → destructive variant text
color.semantic.error_dim    → destructive variant hover background
color.text.tertiary         → disabled text
color.outline.focus         → focus ring
typography.label            → button text (13px DM Sans 500)
radius.xs                   → hover background radius
spacing.3                   → horizontal padding
spacing.2                   → vertical padding
motion.duration.instant     → press response
```

---

## Part 3 Complete

**5 components specified:**
UserCard · PrimaryButton · DestructiveButton · SecondaryButton · TextButton

**The system these five form together:**

Every screen now has a clear visual action hierarchy.
An interviewer looking at your Trip screen will see:
- One filled teal button (complete — do this)
- One outlined red button (cancel — available but secondary)

And immediately understand: this was designed intentionally.
That recognition is what separates a portfolio project
from a generic CRUD app.

**Key decisions you can explain:**

1. Why Complete Trip has two-stage confirmation but Cancel Trip uses a modal
2. Why Summary screen uses SecondaryButton not PrimaryButton for "Book again"
3. Why TextButton is smaller font than PrimaryButton
4. Why DestructiveButton is outlined not filled
5. Why only ONE PrimaryButton per screen

**Before Part 4:**

Part 4 is Trip Anatomy:
RouteTimeline · RouteStopItem · PassengerRow · TripMetaRow

These four components together build the Trip screen's information hierarchy.
The challenge: trip data is dense. These components must make it
scannable without making it feel like a data table.

One question before I write them:

The RouteTimeline shows stops in order — pickup first, drops after.
In your backend, stops come from `trip.stops` array sorted by `stopOrder`.

A user might be stop 1 (picked up first) or stop 3 (picked up last).
Should the timeline highlight which stop belongs to the current user,
or treat all stops equally?

Highlight = more personalized, clearer for the user
Equal treatment = cleaner, simpler

Which do you want?
