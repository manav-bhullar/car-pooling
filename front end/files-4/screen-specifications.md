# CarpoolTU — Screen Specifications
**Design Language:** Material 3 Expressive — Personal Infrastructure  
**Theme:** Late Evening Commute  
**Platform:** Desktop-first web  
**Token Reference:** theme-tokens.json  

---

## Foundational Rule (Read Before Every Screen)

Every screen has one job: answer the user's biggest anxiety immediately.
Visual priority order always flows from that anxiety downward.
If the most important element is not the first thing the eye lands on, the layout is wrong.

---

---

# Screen 1: User Selector

## Purpose
Entry point. No user is authenticated. The app needs to know who is acting.
In production this would be Firebase Auth. In demo this is the 5 seeded users.
This screen must feel like a welcoming threshold, not a form.

## User Emotional State
Neutral. No anxiety yet. First impression moment.
The user has never seen this app. In 3 seconds they decide if it feels trustworthy.

## User's Biggest Worry
*"Is this a real thing or a student side project?"*
The design must answer: this is real infrastructure.

## Layout Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [Logo mark]  CarpoolTU                           │  ← 72px from top
│   Thapar University Shared Rides                   │
│                                                     │
│   ─────────────────────────────────────────────    │  ← divider at 160px
│                                                     │
│   Continue as                                      │  ← label, 24px below divider
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │  Alice   │  │   Bob    │  │ Charlie  │        │  ← user cards row 1
│   └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│   ┌──────────┐  ┌──────────┐                       │
│   │  Diana   │  │   Eve    │                       │  ← user cards row 2
│   └──────────┘  └──────────┘                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Visual Priority Order
1. App name — establishes identity
2. Tagline — establishes purpose in one line
3. User cards — the only action available

## Desktop Layout Measurements
- Content column: 480px wide, centered in viewport
- Logo mark: 32×32px, accent color (#5EBFAD)
- App name: display_medium (36px Fraunces 600)
- Tagline: body (15px DM Sans 400), text_secondary color
- Divider: 1px, outline_subtle color, full content width
- "Continue as" label: label (13px DM Sans 500), text_tertiary
- User card grid: 2 columns × 3 rows with gap of 12px
- User card size: 148px × 80px
- User card radius: radius_md (12px)
- User card background: surface_default (#232325)
- User card border: 1px outline_default (#3A3A3C)
- User name inside card: title (17px DM Sans 500), text_primary
- User email inside card: caption (11px DM Sans 400), text_tertiary
- Vertical centering: content block centered vertically in viewport

## User Card Interaction States
- Default: surface_default background, outline_default border
- Hover: surface_container background, outline_focus border (accent color), translateY(-2px) transform, 200ms standard easing
- Active/pressed: surface_elevated background, scale(0.98), 100ms instant easing
- Focus (keyboard): outline_focus ring, 2px offset

## Responsive Behaviour
- Below 600px: single column cards, full width each
- Cards never go below 140px width

## Loading States
None — this screen has no API calls. Renders immediately.

## Empty States
Not applicable — users are always seeded.

## Error States
Not applicable at this screen.

## Motion
Screen entrance: fade in, opacity 0→1, 300ms decelerate easing.
Cards stagger in with 40ms delay between each — top-left to bottom-right.
Stagger communicates "these are distinct choices" not "this is a list."

## Interaction Notes
- Clicking a card dispatches SELECT_USER action immediately
- No confirmation step — selection is instant
- After selection, app transitions to Home (or correct screen based on persisted state)
- No back navigation exists on this screen — it is the root

---

---

# Screen 2: Home

## Purpose
The ride request form. User is authenticated, no active request exists.
This is where the journey begins. The form must feel effortless.

## User Emotional State
Calm but purposeful. They know where they're going.
They are at Thapar gate or in their room, about to leave.
*"Will I actually find someone to share with?"*

## Visual Priority Order
1. Reassurance that the system works — a subtle social proof or system status hint
2. Pickup input — first because it anchors the journey
3. Drop input — second
4. Time picker — third, least anxiety-inducing
5. Submit button — last, but visually prominent when form is valid

## Layout Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│  CarpoolTU            [Alice ▾]                          │  ← header, 56px height
├──────────────────────────────────────────────────────────┤
│                                                          │
│         Request a Ride                                   │  ← display_small (28px Fraunces)
│         Share your journey home                          │  ← body, text_secondary
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ● Pickup location                                 │  │  ← location input
│  │    Search for a location...                        │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  │  (connecting line between pickup and drop)     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  ● Drop location                                   │  │  ← location input
│  │    Search for a location...                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Preferred departure time                                │  ← label
│  ┌────────────────────────────────────────────────────┐  │
│  │  📅  Tuesday, Jun 8 · 6:30 PM                      │  │  ← datetime input
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Request Ride →                           │  │  ← primary CTA
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Matching runs every 60 seconds · Flat fare ₹12/km      │  ← trust line
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Desktop Layout Measurements
- Content column: 560px centered
- Page title: display_small (28px Fraunces 500)
- Subtitle: body_large (16px DM Sans 400), text_secondary
- Location input card: full content width, radius_lg (16px)
- Location input card background: surface_default (#232325)
- Location input card border: 1px outline_default
- Pickup dot: 10px circle, accent color (#5EBFAD)
- Drop dot: 10px circle, error color (#FF453A) — red for destination is universal
- Connecting line between dots: 1px dashed, outline_default, 32px height
- Input text when empty: body (15px), text_tertiary (placeholder)
- Input text when filled: body (15px), text_primary
- Gap between location card and time picker: spacing_6 (24px)
- Time picker: same card style as location inputs, single row
- Gap between time picker and CTA: spacing_8 (32px)
- CTA button: full content width, 52px height, radius_sm (8px)
- CTA background: accent (#5EBFAD), text: on_accent (#0D1F1C)
- CTA font: title (17px DM Sans 500)
- Trust line: caption (11px DM Sans 400), text_tertiary, centered

## Header
- Height: 56px
- Background: background_primary (#1C1C1E)
- Bottom border: 1px outline_subtle
- Left: "CarpoolTU" in label (13px DM Sans 500), text_secondary
- Right: User name + chevron, same style — clicking opens user switch

## Autocomplete Dropdown
- Appears below the active input
- Background: surface_elevated (#323234)
- Border: 1px outline_default
- Radius: radius_md (12px)
- Max height: 240px, scrollable
- Each result: 48px height, body (15px), padding spacing_4 (16px)
- Hover state: surface_container background
- No results state: "No locations found" in text_tertiary, centered
- Loading state: single pulse skeleton line, 200ms shimmer

## CTA Button States
- Disabled (form incomplete): accent color at 30% opacity, cursor not-allowed
- Enabled: full accent color
- Loading (after submit): spinner replaces arrow icon, button disabled, text "Finding your ride..."
- Transition: 200ms fast easing on opacity change

## Validation
- Inline, appears below the relevant input on blur
- Error text: 12px DM Sans, error color (#FF453A)
- Never show errors on keystroke — only after user leaves the field
- Pickup = drop: error shown on drop field immediately

## Loading States
- Initial page load: skeleton for form card, 300ms fade in when ready
- Autocomplete: inline "Searching..." text inside dropdown, replaces results

## Empty States
Form IS the empty state — no illustration needed.
Trust line at bottom answers "how does this work?" without requiring the user to ask.

## Error States
- Network failure on submit: inline error below CTA button
  Text: "Couldn't submit your request. Check your connection."
  Re-enables button immediately
- Duplicate pending request (409): 
  Banner notification at top of content area
  Text: "You already have an active request."
  Link: "View it →" navigates to Waiting screen

## Motion
- Autocomplete dropdown: height 0→auto, opacity 0→1, 200ms standard easing
- Form card: no animation — it is always present
- CTA state change: opacity transition 200ms only
- Error messages: opacity 0→1, translateY(4px)→0, 200ms

## Interaction Notes
- Tab order: Pickup → Drop → Time → CTA
- Pressing Enter in pickup moves focus to drop
- Pressing Enter in drop moves focus to time
- Pressing Enter in time submits if form is valid
- Autocomplete results keyboard navigable with arrow keys
- ESC dismisses autocomplete without clearing input

---

---

# Screen 3: Waiting

## Purpose
The highest-anxiety screen in the app.
User has submitted a request. Nothing visible is happening.
This screen's entire job is to make waiting feel active, not broken.

## User Emotional State
Anxious and increasing. Peaks at 90 seconds.
*"Why is nothing happening? Is the app broken?"*

The screen must answer this anxiety without the user having to ask.

## Layout Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│  CarpoolTU            [Alice ▾]                          │  ← header
├──────────────────────────────────────────────────────────┤
│                                                          │
│         Finding your ride...                            │  ← display_medium (36px Fraunces)
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │    ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●    │  │  ← ROUTE ANIMATION
│  │    Thapar University              Home          │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Waiting for  2m 14s                                    │  ← elapsed timer (DM Mono)
│  Checked 2 times · Next check in ~38s                  │  ← system status
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Your request                                           │  ← section label
│  Thapar University → Home                               │
│  Today at 6:30 PM                                      │
│                                                          │
│                        Cancel ride                      │  ← cancel, below fold initially
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## The Route Animation (Core Element)
This is the "mid between A and B" animation we decided on.

Two dots connected by a dashed line.
The dashes animate along the path — stroke-dashoffset decreasing infinitely.
Speed: 1800ms per cycle, linear easing.
Left dot: accent color (#5EBFAD) — pickup
Right dot: accent color (#5EBFAD) — drop
Dashes: accent color at 60% opacity
Background of animation card: surface_default with accent_dim wash (#5EBFAD20)

This communicates: the system is actively working between your two points.
It does not show a spinner (implies unknown duration).
It does not show a progress bar (implies known duration).
It shows movement between origin and destination — which is exactly what the system is doing.

## Phase-Based Messaging
The primary message changes based on elapsed time.
This prevents the screen from feeling static.

| Elapsed | Primary Message | Secondary |
|---------|----------------|-----------|
| 0–10s | "Setting up your request..." | — |
| 10–60s | "Finding your ride..." | "Matching runs every 60 seconds" |
| 60–120s | "Still searching..." | "Checked once · Next check soon" |
| 120–240s | "Expanding search..." | "Your priority increases each cycle" |
| 240s+ | "Extended search in progress" | "Cancel and retry with updated time?" |

Primary message: display_medium (36px Fraunces 600)
Secondary message: body (15px DM Sans 400), text_secondary

## Visual Priority Order
1. Route animation — proves the system is alive
2. Primary message — tells them what state they're in
3. Elapsed timer — gives them a number to watch
4. System status (cycles checked, next check) — answers "is this broken?"
5. Request summary — confirms the correct request is active
6. Cancel button — always accessible, never prominent

## Desktop Layout Measurements
- Content column: 560px centered
- Animation card: full content width, 120px height, radius_lg (16px)
- Animation card background: surface_default + accent_dim overlay
- Route dots: 12px diameter circles
- Route line: 2px stroke, dashed (8px dash, 6px gap)
- Animation card top margin: spacing_8 (32px) below title
- Elapsed timer: data_large (24px DM Mono 400), text_primary
- "Waiting for" label: label (13px DM Sans 500), text_secondary
- Timer and label on same line, label left, timer right
- System status: caption (11px DM Sans 400), text_tertiary
- Divider: spacing_6 (24px) above and below
- Request summary: body (15px DM Sans 400), text_secondary
- Cancel button: text-only button, label style, error color (#FF453A)
- Cancel position: right-aligned, spacing_10 (40px) below request summary

## Match Found Transition State
When polling detects status === 'MATCHED':

The route animation accelerates — dash speed increases to 400ms.
The animation card background transitions from accent_dim to accent color at 15% opacity.
Primary message changes to "Match found!" in accent color.
Secondary message: "Loading your trip details..."

After 800ms: screen transitions out (fade + translateY 8px down).
Trip screen fades in (from translateY 8px up to 0).

This 800ms gap bridges the async gap between MATCHED detection and trip data loading.
The user sees celebration, not a blank screen.

Duration of transition state: 800ms minimum, extends until trip data loaded.
Maximum extension: 3000ms — if trip data not loaded in 3s, show "Taking longer than expected..."

## Loading States
Screen renders immediately with route animation running.
No skeleton needed — the animation IS the loading state.

## Empty States
Not applicable — this screen only renders when rideRequest exists.

## Error States
- Poll network failure: subtle banner at top of card
  Text: "Connection issue — retrying..."
  Color: warning (#F0A500), dismissible, auto-hides when connection restores
  Never navigate away — transient network issues should not disrupt the user
- Auto-cancel (max cycles reached): 
  Animation stops. Card background shifts to surface_container.
  Message: "No match found this time."
  Secondary: "Your request has expired."
  CTA appears: "Try again with same route →" (accent color button)
  This replaces the cancel button — not an error state, a recovery state

## Motion
- Elapsed timer: updates every 1 second, no animation — just text change
- Phase message change: crossfade, opacity 0→1, 200ms
- Match found acceleration: animation speed transition, 500ms
- Card background wash transition: 500ms standard easing

## Interaction Notes
- Cancel button confirmation: inline confirmation, not modal
  "Are you sure?" appears below button with "Yes, cancel" and "Keep searching"
  No modal — this is a PENDING cancel, no cascade, low stakes
- Back button / browser back: shows inline confirmation same as cancel button
- Poll interval: 10 seconds (defined in useRideRequestPoller)
- User should never need to manually refresh

---

---

# Screen 4: Trip

## Purpose
The user is matched and in an active trip.
Highest information density screen. Must answer three questions instantly:
1. How much am I paying?
2. Will I reach on time?
3. Who am I sharing with?

## User Emotional State
Focused and grounded. Anxiety is resolved — match found, trip active.
Residual concern: cost and timing.
*"How much am I paying and will I reach on time?"*

## Layout Hierarchy (Unified Single Column + Map)

```
┌──────────────────────────────────────────────────────────┐
│  CarpoolTU  ● TRIP ACTIVE        [Alice ▾]               │  ← header with status
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │  Your fare           │  │  Estimated arrival      │  │  ← TWO HERO CARDS (above fold)
│  │  ₹47.40              │  │  ~12 min                │  │
│  └──────────────────────┘  └─────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [MAP — FULL WIDTH, 320px HEIGHT]                  │  │  ← Leaflet map
│  │  Route polyline in accent color                   │  │
│  │  Stop markers numbered                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Route                                                  │  ← section label
│  ┌────────────────────────────────────────────────────┐  │
│  │  ▲ Thapar University Main Gate         Pickup      │  │
│  │  │                                                 │  │
│  │  ● Civil Lines, Patiala                Pickup      │  │
│  │  │                                                 │  │
│  │  ▼ Urban Estate Phase 2                Drop        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Sharing with                                           │  ← section label
│  ┌────────────────────────────────────────────────────┐  │
│  │  Rohan S.          ₹47.40                          │  │
│  │  Priya K.          ₹39.20                          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Trip details                                           │  ← section label
│  Total distance · 8.4 km    Detour ratio · 12%         │
│                                                          │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │   Complete Trip      │  │      Cancel Trip        │  │  ← action row
│  └──────────────────────┘  └─────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Visual Priority Order
1. Fare hero card — answers "how much am I paying" immediately
2. ETA hero card — answers "will I reach on time"
3. Map — spatial grounding, visual confirmation of route
4. Stop sequence — "where does the car go"
5. Co-riders — "who am I sharing with"
6. Trip metadata — distance, detour ratio
7. Action buttons — always accessible, never dominant

## Desktop Layout Measurements
- Content column: 760px centered (wider than other screens — more data)
- Hero cards row: two cards side by side, gap spacing_4 (16px)
- Each hero card: 50% width minus half gap, height 96px, radius_lg (16px)
- Hero card background: surface_default (#232325)
- Hero card border: 1px outline_default
- Fare label: label (13px DM Sans 500), text_secondary
- Fare amount: data_hero (40px DM Mono 500), accent color (#5EBFAD)
- ETA label: label (13px DM Sans 500), text_secondary
- ETA amount: data_hero (40px DM Mono 500), text_primary
- Map container: full content width, 320px height, radius_lg (16px)
- Map top/bottom margin: spacing_6 (24px)
- Route polyline: accent color (#5EBFAD), 3px weight
- Stop section: full width card, surface_default, radius_md (12px)
- Stop row height: 48px
- Stop type indicator: colored dot, pickup = accent, drop = error color
- Connector line between stops: 1px dashed, outline_subtle, left-aligned with dots
- Co-riders section: full width card, surface_default, radius_md (12px)
- Co-rider row: 48px height, name body (15px) left, fare data_large (24px DM Mono) right
- Trip metadata: two items inline, body (15px), text_secondary
- Action row: two buttons side by side, gap spacing_4 (16px)
- Complete Trip: 50% width, 52px height, accent background, on_accent text, radius_sm (8px)
- Cancel Trip: 50% width, 52px height, surface_elevated background, error color text, radius_sm (8px)

## Header Status Indicator
When TRIP_ACTIVE: green dot (8px, success color #4CAF7D) + "TRIP ACTIVE" label
Label: caption (11px DM Sans 500), letter-spacing 0.05em, success color
Position: center of header

## Detour Ratio Display
Always shown as percentage + savings pair.
"12% detour · You save ₹47 vs solo"
This pair is mandatory — detour without context creates anxiety.
If savings cannot be computed: show detour only, omit savings line.
Font: body (15px DM Sans 400), text_secondary

## Cancel Trip — Cascade Warning Modal
Cancel Trip button opens a modal. This is the one place we use a modal.
Reason: cascade cancellation affects other users — high stakes.

Modal specs:
- Overlay: background_primary at 80% opacity
- Modal card: surface_elevated (#323234), radius_lg (16px), 480px wide
- Title: headline (22px DM Sans 600), text_primary — "Cancel your trip?"
- Body: body_large (16px DM Sans 400), text_secondary
  "Cancelling will return your 2 co-riders to the waiting queue."
- Co-rider names listed as chips below body text
- Two buttons: "Keep Trip" (accent, primary) | "Cancel Anyway" (error color, secondary)
- Keep Trip is left/primary — friction is intentional
- ESC key does NOT dismiss — user must explicitly choose

## Loading States
- Fare: skeleton pill, 120px × 40px, shimmer animation
- ETA: same skeleton treatment
- Map: grey placeholder card with subtle pulse, "Loading map..." caption
- Co-riders: two skeleton rows, 48px each
- Skeletons use surface_container (#2A2A2C) with surface_elevated (#323234) shimmer

## Empty States
- No co-riders listed: "Solo trip" label — should never happen in this system but handle gracefully
- Map fails to load: static fallback showing numbered stop list only, no map tile

## Error States
- Complete trip fails (400 TRIP_NOT_COMPLETABLE):
  Warning notification banner: "Trip couldn't be completed — it may have been cancelled."
  Dispatches state check poll immediately
- Co-rider cancels (detected via trip poll becoming CANCELLED):
  Screen does NOT show an error — the architecture handles navigation
  But a notification banner fires before navigation:
  "A co-rider cancelled. You've been returned to the queue."
  Then navigates to Waiting screen with re-queue state

## Responsive Behaviour
- Below 900px: same single column, map height reduces to 240px
- Below 600px: hero cards stack vertically, each full width

## Motion
- Screen entrance: cards stagger in, 60ms delay each, 300ms decelerate easing
- Map loads: fade in 400ms after tile data ready
- Complete button: scale(0.98) on press, 100ms
- Cancel modal: overlay fades in 200ms, card scales from 0.95 to 1.0 with expressive easing

## Interaction Notes
- Complete Trip requires single click then confirmation via modal — NOT window.confirm()
- Trip screen polls every 30 seconds via useTripPoller
- If trip status becomes COMPLETED externally: navigate to Summary without user action
- If trip status becomes CANCELLED externally: show banner then navigate to Waiting

---

---

# Screen 5: Summary

## Purpose
Post-trip review. The user's journey is complete.
This screen defines the lasting impression of the product.
If it makes the user feel their decision to share was worth it — they use the app again.

## User Emotional State
Satisfied and reflective. Low anxiety.
*"Was this worth it compared to going alone?"*

The screen must answer this with a number before anything else.

## Layout Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│  CarpoolTU                          [Alice ▾]            │  ← header, no status indicator
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Trip complete                                          │  ← display_large (48px Fraunces 700)
│  Today at 6:42 PM                                       │  ← body, text_secondary
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  You paid          You saved                       │  │  ← SAVINGS HERO CARD
│  │  ₹47.40            ₹54.60                         │  │
│  │                    vs travelling alone             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Route taken                                            │  ← section label
│  Thapar University → Urban Estate Phase 2              │
│  8.4 km · 3 stops · 24 minutes                        │
│                                                          │
│  Shared with                                            │  ← section label
│  Rohan S.  ·  Priya K.                                 │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Book another ride →                      │  │  ← CTA (subtle, not urgent)
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Visual Priority Order
1. "Trip complete" headline — emotional resolution
2. Savings hero card — answers "was it worth it" with a number
3. Route summary — closes the loop on the journey
4. Co-riders — acknowledges the shared experience
5. Book again CTA — subtle, not pushy

## Savings Hero Card (Most Important Element)
This card must make the saving feel real.

Left cell: "You paid" label + fare amount in data_hero
Right cell: "You saved" label + saving amount in data_hero + "vs travelling alone" caption

Right cell background: success_dim (#4CAF7D18) — green wash, subtle
Right cell fare color: success (#4CAF7D) — the saving number is green
Left cell fare color: text_primary

How to calculate solo cost:
soloDistance = trip.totalDistanceKm × 1.35 (road correction factor)
soloCost = soloDistance × 12 (FARE_PER_KM)
saving = soloCost - trip.fareShare

If saving is negative (rare edge case): omit the savings cell entirely.
Show only "You paid" in full-width card.

## Desktop Layout Measurements
- Content column: 560px centered
- "Trip complete" headline: display_large (48px Fraunces 700), text_primary
- Completion time: body (15px DM Sans 400), text_secondary, spacing_2 (8px) below headline
- Savings hero card: full content width, 96px height, radius_lg (16px)
- Card background: surface_default (#232325)
- Card internal: two equal cells, 1px outline_subtle divider between them
- "You paid" label: label (13px DM Sans 500), text_secondary
- Paid amount: data_hero (40px DM Mono 500), text_primary
- "You saved" label: label (13px DM Sans 500), success color (#4CAF7D)
- Saved amount: data_hero (40px DM Mono 500), success color (#4CAF7D)
- "vs travelling alone": caption (11px DM Sans 400), text_tertiary
- Dividers: 1px outline_subtle, full content width
- Section labels: label (13px DM Sans 500), text_tertiary, letter-spacing 0.02em
- Route text: body (15px DM Sans 400), text_primary
- Route metadata: caption (11px DM Sans 400), text_secondary, spacing_1 (4px) below route
- Co-rider names: body (15px DM Sans 400), text_secondary, separated by " · "
- CTA button: full content width, 52px, radius_sm (8px)
- CTA background: surface_container (#2A2A2C) — intentionally subdued
- CTA text: accent color (#5EBFAD), title (17px DM Sans 500)
- CTA is NOT accent-filled — it should not feel like pressure to book again immediately

## Header
No status indicator on Summary screen.
The journey is complete — the header is clean.

## Responsive Behaviour
- Below 600px: savings card stacks vertically — paid above, saved below, each full width
- Route and co-rider sections unchanged

## Loading States
Summary screen only renders when trip.status === 'COMPLETED'.
Data is always present before this screen shows.
No loading states needed.

## Empty States
- If savings cannot be computed: savings cell omitted, card shows only "You paid"
- If co-riders array empty: "Shared with" section omitted entirely

## Error States
- If user navigates directly to /summary/:id and trip is not theirs: redirect to /home silently
- If trip data fails to load: show "Trip summary unavailable" with "Go home →" link
  No error styling — plain text_secondary, centered

## Motion
- Screen entrance: display_large title fades in first (300ms)
- Savings card enters 100ms after title: scale 0.97→1.0, opacity 0→1, 400ms expressive easing
- The saved amount specifically: counter animates from 0 to final value, 600ms, easing out
  This is the one numerical animation in the entire app — it earns special treatment
  because the saving number IS the emotional payoff moment
- Remaining sections stagger in at 60ms intervals, 200ms each

## Interaction Notes
- "Book another ride →" dispatches RESET action then navigates to /home
- No confirmation needed — going home is always safe
- URL /summary/:id must remain valid on refresh
- If user refreshes: re-derives state from backend, stays on summary if trip.status === 'COMPLETED'
- Back button navigates to /home — no back stack into the trip screen

