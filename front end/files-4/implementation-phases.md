# CarpoolTU Frontend — Implementation Phases
## From Skeleton to Complete

---

## Design System Files — Completion Status

| File | Status | Purpose |
|------|--------|---------|
| `theme-tokens.json` | ✅ Complete | All design values. Source of truth. |
| `screen-specifications.md` | ✅ Complete | All 5 screens fully specified. |
| `components-part1.md` | ✅ Complete | Foundation + Inputs (7 components) |
| `components-part2.md` | ✅ Complete | Display components (6 components) |
| `components-part3.md` | ✅ Complete | Actions + Navigation (5 components) |
| `components-part4.md` | ✅ Complete | Trip Anatomy (4 components) |
| `components-part5.md` | ✅ Complete | Overlays + Animation (3 components) |
| `design-system.css` | ✅ Complete | CSS custom properties. Ready to import. |
| `implementation-phases.md` | ✅ This file | Build roadmap. |

**Total: 9 design system files. All complete.**

---

## The One Rule Before You Start

Every phase ends with a working, testable state.
You never move to the next phase with broken code.
If something is broken at the end of a phase — fix it before moving on.

A broken foundation does not become stable by building on top of it.

---

## Phase Overview

```
Phase 0 → Connect design system to codebase
Phase 1 → User Selector Screen
Phase 2 → Home Screen (form, no autocomplete yet)
Phase 3 → Nominatim Autocomplete
Phase 4 → Waiting Screen
Phase 5 → Trip Screen (data + layout, no map)
Phase 6 → Leaflet Map
Phase 7 → Summary Screen
Phase 8 → Cancel Modal + Notification Banner
Phase 9 → Animations
Phase 10 → Polish + Audit
```

---

---

## Phase 0 — Connect Design System
**Estimated effort:** 1-2 hours
**Depends on:** Nothing. Do this first.
**Output:** CSS variables available everywhere. Fonts loading.

### What This Phase Does
Right now your skeleton has no visual identity.
This phase connects `design-system.css` to your React app
so every component can use `var(--color-accent)` etc.

It also verifies your AppContext shape matches what
the design system expects before you build any UI on top of it.

### Tasks

**Task 0.1 — Import design-system.css**
In `carpool-frontend/src/main.jsx`:
```
import './design-system.css'
```
That's it. One line. All CSS variables now available globally.

Verify: open browser devtools → Elements → :root
You should see all `--color-*`, `--font-*`, `--space-*` variables listed.
If you don't see them — the import path is wrong.

**Task 0.2 — Verify Google Fonts loading**
Open Network tab in devtools. Reload page.
You should see requests to `fonts.googleapis.com`.
Look for: Fraunces, DM Sans, DM Mono.
If fonts are not loading — check your internet connection and
that the @import at top of design-system.css is not blocked.

Quick visual test: add this temporarily to body in devtools:
`font-family: 'Fraunces', serif`
If headings look different — fonts are loading correctly.
Remove after testing.

**Task 0.3 — Audit AppContext state shape**
Open `src/context/AppContext.jsx`.
Verify top-level state has exactly these keys:
```
user: null
rideRequest: null
trip: null
uiState: 'IDLE'
loading: { init, submitting, cancelling, completing }
error: null
```
If you have extra keys at top level — this is the time to clean them.
Extra keys at top level create confusion later.

**Task 0.4 — Verify deriveUIState is a pure function**
Open `src/utils/stateUtils.js`.
Check: does it call any API? Does it touch localStorage?
It should receive `(rideRequest, trip)` and return a string. Nothing else.
If it does anything else — that is a bug. Fix it now.

**Task 0.5 — Verify routing works for all 5 screens**
Manually navigate to each URL:
- `localhost:5173/`
- `localhost:5173/home`
- `localhost:5173/waiting`
- `localhost:5173/trip/fake-id`
- `localhost:5173/summary/fake-id`

Each should render something — even if it's just a div with text.
None should throw a white screen error.
Route guards redirecting is fine and expected.

### Phase 0 Complete When
- CSS variables visible in devtools :root
- Fonts loading (Fraunces, DM Sans, DM Mono)
- AppContext shape is clean
- All 5 routes render without crashing
- deriveUIState is a pure function

---

---

## Phase 1 — User Selector Screen
**Estimated effort:** 2-3 hours
**Depends on:** Phase 0 complete
**Output:** First styled screen. Sets the visual bar for everything else.

### Why Start Here
UserSelector has no API calls. No polling. No complex state.
It is the simplest screen to style — which makes it the right
place to establish your design system patterns before complexity arrives.

When this screen looks right, you have proof that your
CSS variables work, your fonts load, and your spacing system is correct.

### What You Are Building
5 user cards on a centered column.
App wordmark. Tagline. Section label.
Clicking a card dispatches SELECT_USER and navigates to /home.

### Tasks

**Task 1.1 — Page structure**
The screen needs:
- A centered column: `max-width: var(--layout-content-narrow)` (480px)
- Vertical centering in viewport
- App wordmark at top
- Divider
- "Continue as" label
- Grid of user cards

**Task 1.2 — App wordmark**
"CarpoolTU" text.
Font: `var(--font-display)` (Fraunces)
Size: `var(--text-4xl)` (36px)
Weight: `var(--weight-semibold)`
Color: `var(--color-text-primary)`

This is the first time you will use Fraunces in a real component.
Verify it looks right — distinct from DM Sans.

**Task 1.3 — UserCard component**
Reference: components-part3.md → UserCard spec

Key measurements:
- Width: 148px, Height: 80px
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-outline)`
- Radius: `var(--radius-md)` (12px)
- Name: `var(--font-body)`, `var(--text-xl)` (17px), weight 500
- Email: `var(--font-body)`, `var(--text-xs)` (11px), `var(--color-text-tertiary)`

Hover state:
- Background: `var(--color-surface-container)`
- Border: `1px solid var(--color-outline-focus)`
- Transform: translateY(-2px)
- Transition: `var(--duration-fast) var(--ease-standard)` (200ms)

**Task 1.4 — Card grid**
5 cards in a 3-column grid.
Row 1: Alice, Bob, Charlie
Row 2: Diana, Eve (left-aligned, not centered)
Gap: `var(--space-3)` (12px)

**Task 1.5 — Wire up click handler**
Card click → dispatch SELECT_USER → navigate to /home
This should already work from your skeleton.
Verify it still works after styling.

### Phase 1 Complete When
- Screen looks like the UserSelector spec
- Fonts rendering correctly (Fraunces for title, DM Sans for cards)
- Hover states working on cards
- Clicking a card navigates to /home
- No console errors

### Interview Question For This Phase
"Why does the UserSelector use a narrow 480px column instead
of filling the full screen width?"

Answer before moving on.

---

---

## Phase 2 — Home Screen (Form Without Autocomplete)
**Estimated effort:** 3-4 hours
**Depends on:** Phase 1 complete
**Output:** Styled form that submits. Autocomplete is a plain text input for now.

### Why Split Form From Autocomplete
Nominatim autocomplete is its own complex feature.
Building it mixed into the form means if autocomplete
breaks, the whole form is broken.

In Phase 2: plain text inputs, manual lat/lng for testing.
In Phase 3: replace plain inputs with autocomplete.

This is called progressive enhancement — get the core working,
then add the complexity layer.

### What You Are Building
GreetingBlock + LocationInputCard (simplified) + Submit button.
Form submits with hardcoded test coordinates first.
Later Phase 3 replaces with real Nominatim results.

### Tasks

**Task 2.1 — GreetingBlock**
Reference: components-part2.md → GreetingBlock spec

"Good [morning/afternoon/evening], {firstName}."
Time-based greeting using current hour.
Tagline: "Your ride home, shared."

Font for greeting: `var(--font-display)`, `var(--text-3xl)` (28px)
Font for tagline: `var(--font-body)`, `var(--text-lg)` (16px)
Color for tagline: `var(--color-text-secondary)`
Bottom margin: `var(--space-8)` (32px)

**Task 2.2 — LocationInputCard shell**
Reference: components-part1.md → LocationInputCard spec

One unified card containing:
- Pickup text input (plain text for now)
- Connecting dashed line between pickup and drop dots
- Drop text input (plain text for now)
- Internal divider
- Date/time input

Card styling:
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-outline)`
- Radius: `var(--radius-lg)` (16px)
- Padding: `var(--space-4)` (16px)

On any field focus:
- Card border changes to `var(--color-outline-focus)`
- Transition: `var(--duration-fast) var(--ease-standard)`

**Task 2.3 — LocationInputRow**
Reference: components-part1.md → LocationInputRow spec

Each row: 48px height, pickup dot left (accent color), drop dot (error color).
Dots: 10px circles.
Connecting dashed line between them: 1px dashed, `var(--color-outline)`, 24px height.

**Task 2.4 — PrimaryButton**
Reference: components-part3.md → PrimaryButton spec

"Request Ride" button.
Full width. 52px height.
Background: `var(--color-accent)` (#5EBFAD)
Text: `var(--color-text-on-accent)` (#0D1F1C)
Font: `var(--font-body)`, `var(--text-xl)` (17px), weight 500
Radius: `var(--radius-sm)` (8px)

Disabled state (when form incomplete):
- Background: `var(--color-accent)` at 30% opacity
- Cursor: not-allowed

**Task 2.5 — Form submission with test data**
For now: hardcode pickup and drop coordinates.
Use the Thapar→home coordinates from your backend tests:
```
pickup: { lat: 30.3525, lng: 76.3616, displayName: "Thapar University" }
drop: { lat: 30.6942, lng: 76.8606, displayName: "Urban Estate Phase 2" }
```

Wire submit button to createRideRequest API.
On success: dispatch SET_RIDE_REQUEST, navigate to /waiting.

This lets you test the full form→waiting flow before autocomplete exists.

**Task 2.6 — 409 duplicate request handling**
If backend returns 409 (user already has PENDING request):
- Fetch current ride request
- Dispatch SET_RIDE_REQUEST
- Show NotificationBanner: "You already have an active request."
- Navigate to /waiting

Reference your existing RideRequestForm.jsx — this logic may already exist.
Verify it works with the new styled form.

### Phase 2 Complete When
- Home screen renders with correct styles
- Form submits with test coordinates
- Navigates to /waiting on success
- 409 handled correctly
- No console errors

### Interview Question For This Phase
"Why are you using hardcoded coordinates in Phase 2
instead of implementing Nominatim immediately?"

Answer before moving on.

---

---

## Phase 3 — Nominatim Autocomplete
**Estimated effort:** 3-4 hours
**Depends on:** Phase 2 complete
**Output:** Real location search working in the form.

### What You Are Building
Replace the plain text inputs from Phase 2 with
the full autocomplete experience.
User types → results appear → user selects → lat/lng stored.

### Key Constraints
- 300ms debounce — do not call Nominatim on every keystroke
- Patiala bounding box — results constrained to local area
- User must SELECT from dropdown — typed text alone is not valid
- Display name trimming — long Nominatim strings need truncating

### Tasks

**Task 3.1 — AutocompleteDropdown component**
Reference: components-part1.md → AutocompleteDropdown spec

Dropdown appears below the card.
Position: absolute.
Background: `var(--color-surface-elevated)`
Border: `1px solid var(--color-outline)`
Radius: `var(--radius-md)` (12px)
Max height: 240px, scrollable.

Each result row: 52px height.
Primary text: display name (trimmed).
Sub-text: area name.

**Task 3.2 — Display name trimming**
Nominatim returns long strings. Trim them:
```
Full: "Thapar Institute of Engineering and Technology, 
       Bhadson Road, Prem Nagar, Patiala, Punjab, India"
Primary: "Thapar Institute of Engineering and Technology, Bhadson Road"
Sub-text: "Patiala, Punjab"
```
Rule: first two comma-segments for primary, next two for sub-text.

**Task 3.3 — Debounce logic**
300ms after user stops typing → call Nominatim.
Use useRef for the debounce timer, not useState.
Clear timer on unmount to prevent memory leaks.

**Task 3.4 — Keyboard navigation**
Arrow keys navigate results.
Enter selects focused result.
ESC closes dropdown without selecting.
Tab moves to next field (closes dropdown).

**Task 3.5 — Validation**
Submit button stays disabled until BOTH locations
have been selected from autocomplete (not just typed).
A typed-but-not-selected value does not count.
Track selection with a separate boolean flag per field.

### Phase 3 Complete When
- Typing in location field shows real Nominatim results
- Selecting a result stores lat/lng correctly
- Debounce working (check Network tab — no rapid-fire requests)
- Keyboard navigation working
- Form only submits when both locations properly selected
- Patiala-area results prioritized

---

---

## Phase 4 — Waiting Screen
**Estimated effort:** 3-4 hours
**Depends on:** Phase 3 complete
**Output:** The most important screen in the app.

### What You Are Building
AnimatedRouteLine + ElapsedTimer + RotatingQuote + phase-based messaging.
The screen that manages anxiety during the 60-second batch cycle.

### Tasks

**Task 4.1 — AnimatedRouteLine (static first)**
Reference: components-part5.md → AnimatedRouteLine spec

Build it without animation first.
Two dots + dashed line. Correct colors and dimensions.
Verify it looks right statically.

Then add the stroke-dashoffset animation:
```css
@keyframes dash {
  to { stroke-dashoffset: 0; }
}
```
stroke-dashoffset from 14 to 0, 1800ms, linear, infinite.

**Task 4.2 — ElapsedTimer**
Reference: components-part2.md → ElapsedTimer spec

Uses `rideRequest.createdAt` (server timestamp — not client start time).
Updates every 1 second via setInterval.
Clears interval on unmount.

Format: `formatElapsed` function from `src/utils/time.js`
(already exists in your codebase — use it, don't rewrite it)

**Task 4.3 — Phase-based messaging**
Different message based on elapsed seconds:
```
0-10s:    "Setting up your request..."
10-60s:   "Finding your ride..."
60-120s:  "Still searching..."
120-240s: "Expanding search..."
240s+:    "Extended search in progress"
```
Crossfade between messages: opacity transition 200ms.

**Task 4.4 — RotatingQuote**
Reference: components-part2.md → RotatingQuote spec

Create `src/constants/quotes.js` with your quote array.
Minimum 6 quotes. You write them — they reflect your product voice.
Rotate every 8000ms, sequential, crossfade transition.

**Task 4.5 — Cancel flow**
TextButton: "Cancel Ride"
Right-aligned, below fold initially.
On click: inline confirmation (not modal — PENDING cancel is low stakes).
"Are you sure?" + "Yes, cancel" + "Keep searching"
On confirm: call cancelRideRequest API, dispatch RESET, navigate to /home.

**Task 4.6 — Match detection**
Polling is already in useRideRequestPoller.
When uiState transitions to MATCHED:
- AnimatedRouteLine enters matched state (accelerate → converge → flash)
- After 800ms: navigate to /trip/:id

### Phase 4 Complete When
- Animation running smoothly (no jank)
- Elapsed timer counting from server timestamp
- Messages changing at correct time thresholds
- Quotes rotating every 8 seconds
- Cancel flow working
- Match transition fires and navigates to Trip screen

---

---

## Phase 5 — Trip Screen (No Map)
**Estimated effort:** 4-5 hours
**Depends on:** Phase 4 complete
**Output:** Full trip data displayed correctly. Map placeholder only.

### What You Are Building
The most information-dense screen.
FareHeroCard + ETAHeroCard + RouteTimeline + PassengerList + Actions.
Map is a grey placeholder in this phase — Leaflet comes in Phase 6.

### Tasks

**Task 5.1 — Hero cards row**
Two cards side by side.
FareHeroCard left, ETAHeroCard right.
Each 50% width minus 8px gap.
96px height.

FareHeroCard:
- Fare amount in `var(--font-data)`, `var(--text-data-hero)` (40px)
- Color: `var(--color-accent)`

ETAHeroCard:
- ETA in `var(--font-data)`, `var(--text-data-hero)` (40px)
- Color: `var(--color-text-primary)`

**Task 5.2 — Map placeholder**
Grey card, 320px height, full width.
Background: `var(--color-surface)`
Border: `1px solid var(--color-outline)`
Radius: `var(--radius-lg)`
Text center: "Map loading..." in `var(--color-text-tertiary)`

You will replace this in Phase 6.

**Task 5.3 — RouteTimeline with 3-tier system**
Reference: components-part4.md → RouteTimeline + RouteStopItem specs

3 tiers:
- Before your stops: dimmed, 8px outline dot, caption text at 60% opacity
- Your stops: highlighted, 12px filled accent dot, accent tag pill
- After your stops: neutral, 10px filled secondary dot

Tier determination logic:
```
userPickupOrder = stops.find(s => 
  s.rideRequestId === currentRideRequest.id && s.type === 'PICKUP'
).stopOrder

userDropOrder = stops.find(s => 
  s.rideRequestId === currentRideRequest.id && s.type === 'DROPOFF'
).stopOrder

tier = stopOrder < userPickupOrder ? 3
     : stopOrder === userPickupOrder || stopOrder === userDropOrder ? 1
     : 2
```

**Task 5.4 — PassengerRow list**
Reference: components-part4.md → PassengerRow spec

Exclude current user from the list.
First name + last initial only ("Rohan S.")
Their fare in `var(--font-data)`, `var(--text-data-sm)` (24px)
Color: `var(--color-text-secondary)` — not accent (that's for your fare only)

**Task 5.5 — TripMetaRow**
Detour % + savings paired together.
Never show detour without savings context.
Reference: components-part4.md → TripMetaRow spec

**Task 5.6 — Action buttons**
PrimaryButton: "Complete Trip" (two-stage confirmation — Phase 3 spec)
DestructiveButton: "Cancel Trip" (opens CancelModal — Phase 8)

For now: Cancel Trip can be a placeholder.
CancelModal is built in Phase 8.

**Task 5.7 — Skeleton loading state**
While trip data loads: show SkeletonBlock placeholders.
Reference: components-part5.md → SkeletonBlock spec

Hero cards: two skeleton cards, 96px height each.
Map: skeleton card, 320px height.
Timeline: skeleton card, 180px height.
Passengers: two skeleton rows.

### Phase 5 Complete When
- Trip screen renders real data from backend
- 3-tier route timeline working correctly
- Your stops highlighted, others dimmed/neutral
- Fare in accent color, co-rider fares in secondary color
- Skeleton shown while loading
- Two-stage Complete Trip confirmation working

---

---

## Phase 6 — Leaflet Map
**Estimated effort:** 2-3 hours
**Depends on:** Phase 5 complete and stable
**Output:** Real map on Trip screen.

### Why Deferred Until Now
Leaflet has its own rendering lifecycle that conflicts
with React's reconciliation if added too early.
By Phase 6, your data flow is confirmed working.
You know exactly what `trip.stops` contains.
Map integration becomes straightforward.

### Tasks

**Task 6.1 — Replace map placeholder**
Install: `leaflet` and `react-leaflet` (already in package.json)
Import Leaflet CSS in your map component.
Fix icon path issue (already in your existing TripMap.jsx — keep it).

**Task 6.2 — Route polyline**
Stops sorted by stopOrder → array of [lat, lng] positions.
Polyline: `var(--color-accent)` (#5EBFAD), 3px weight.

**Task 6.3 — Stop markers**
Each stop: numbered marker.
Pickup markers: accent color.
Dropoff markers: slightly different shade or shape.
Your stops: slightly larger marker.

**Task 6.4 — FitBounds**
Map auto-zooms to show all stops.
Padding: [40, 40].
Already exists in your TripMap.jsx — verify it works.

**Task 6.5 — Map height**
320px on desktop.
240px below 900px viewport.
Map should never overflow its container.

### Phase 6 Complete When
- Map renders with real stop positions
- Route polyline visible in accent color
- Map auto-fits to show all stops
- No console errors from Leaflet
- Map does not cause layout shifts

---

---

## Phase 7 — Summary Screen
**Estimated effort:** 2-3 hours
**Depends on:** Phase 5 complete
**Output:** Post-trip review with savings calculation.

### Tasks

**Task 7.1 — Completion headline**
"Trip complete" in `var(--font-display)`, `var(--text-hero)` (48px)
Completion time below it.

**Task 7.2 — SavingsHeroCard**
Reference: components-part2.md → SavingsHeroCard spec

Two cells: "You paid" left, "You saved" right.
Right cell has `var(--color-success-dim)` background wash.
Savings amount in `var(--color-success)`.

Savings calculation:
```
soloDistance = trip.totalDistanceKm × 1.35
soloCost = soloDistance × 12
saving = soloCost - trip.fareShare
```
If saving ≤ 0: render paid-only variant.

**Task 7.3 — Savings counter animation**
The saved amount counts up from 0 to final value on mount.
600ms, ease-out easing.
This is the ONE numerical animation in the entire app.
Respects prefers-reduced-motion — show final value instantly if set.

**Task 7.4 — Route summary + co-riders**
TripMetaRow summary variant.
Co-rider names inline, separated by "·".

**Task 7.5 — Book again CTA**
SecondaryButton (outlined, NOT filled).
"Book another ride →"
On click: dispatch RESET, navigate to /home.

### Phase 7 Complete When
- Savings calculated and displayed correctly
- Counter animation working
- Refreshing on /summary/:id stays on summary (not redirect)
- "Book again" resets state and goes to home

---

---

## Phase 8 — CancelModal + NotificationBanner
**Estimated effort:** 2-3 hours
**Depends on:** Phase 5 complete
**Output:** Full cancel flow. Notification system working.

### Tasks

**Task 8.1 — CancelModal**
Reference: components-part5.md → CancelModal spec

Triggered by DestructiveButton on Trip screen.
"Keep Trip" button receives focus on open.
ESC does NOT close — user must click a button.
Focus trapped inside modal while open.

Co-rider chips showing affected names.
"Keep Trip" left (primary, filled accent).
"Cancel Anyway" right (outlined error).

**Task 8.2 — Cascade cancel flow**
"Cancel Anyway" → loading state → cancelRideRequest API →
on success: dispatch RESET → navigate to /home →
show NotificationBanner: "Trip cancelled. Co-riders returned to queue."

**Task 8.3 — NotificationBanner**
Reference: components-part1.md → NotificationBanner spec

4 variants: error, warning, info, success.
Slides down from top of content area.
Auto-hides: info (5s), success (3s).
Persists until dismissed: error, warning.
Only one banner at a time.

**Task 8.4 — Re-queue notification**
When co-rider cancels (trip poll detects CANCELLED):
Before navigation: show warning banner:
"A co-rider cancelled. You've been returned to the queue."
Then navigate to /waiting.

### Phase 8 Complete When
- Cancel modal opens and closes correctly
- Focus trap working in modal
- Cascade cancel works end-to-end
- NotificationBanner appears for all relevant events
- Re-queue notification fires before navigation

---

---

## Phase 9 — Animations
**Estimated effort:** 3-4 hours
**Depends on:** All screens working correctly
**Output:** Design system motion language applied throughout.

### Why Animations Are Last
Animations require stable DOM structure.
If you add animations to components that are still changing,
you will fight the animation system constantly.
Animations are the last layer — applied to finished components.

### Tasks

**Task 9.1 — Screen entrance animations**
Each screen: opacity 0→1, translateY(8px)→0
Duration: `var(--duration-standard)` (300ms)
Easing: `var(--ease-decelerate)`

**Task 9.2 — Card stagger on Trip screen**
Hero cards, timeline rows, passenger rows stagger in.
50ms delay between each, 300ms duration.

**Task 9.3 — Matched state animation**
AnimatedRouteLine matched sequence:
Phase 1: accelerate (0-300ms)
Phase 2: converge (300-600ms)
Phase 3: flash + resolve (600-800ms)
Reference: components-part5.md → AnimatedRouteLine matched state spec

Use state machine — not nested setTimeout.

**Task 9.4 — SavingsHeroCard entrance spring**
scale 0.97→1.0, opacity 0→1
Duration: `var(--duration-expressive)` (500ms)
Easing: `var(--ease-expressive)` (slight spring)

**Task 9.5 — Reduced motion audit**
Go through every animation.
Verify each one is disabled when
`prefers-reduced-motion: reduce` is set.
The global CSS rule in design-system.css handles most of this.
AnimatedRouteLine needs special handling — verify it.

---

---

## Phase 10 — Polish + Audit
**Estimated effort:** 2-4 hours
**Depends on:** All previous phases complete
**Output:** Production-ready frontend.

### Tasks

**Task 10.1 — Visual consistency audit**
Go screen by screen. For each screen ask:
- Does every color come from a CSS variable?
- Does every font size come from a CSS variable?
- Does every spacing value come from a CSS variable?
- Are there any hardcoded hex values? (grep for #)
- Are there any hardcoded px values that should be tokens?

**Task 10.2 — Keyboard navigation audit**
Go through entire app using keyboard only. No mouse.
Every interactive element must be reachable with Tab.
Every interactive element must show a visible focus ring.
Modal focus trap must work.
ESC behavior must match specs.

**Task 10.3 — Error states audit**
Manually break things and verify error states:
- Kill backend → what does the app show?
- Submit form with network off → what happens?
- Navigate to /trip/fake-id → does route guard redirect?
- Let request expire → does auto-cancel notification appear?

**Task 10.4 — Refresh recovery audit**
With each lifecycle state active, refresh the page.
Verify the app returns to the correct screen:
- Refresh during PENDING → lands on /waiting
- Refresh during TRIP_ACTIVE → lands on /trip/:id
- Refresh on COMPLETED → lands on /summary/:id
- Refresh on IDLE → lands on /home

**Task 10.5 — Typography consistency**
Verify Fraunces is only used for:
- Screen display headings
- Emotional headline moments (waiting screen primary message)

DM Sans for all UI text.
DM Mono for all numbers (fare, distance, ETA, timer).

If you find a number in DM Sans — fix it.

**Task 10.6 — Responsive check**
Resize browser to 900px, 768px, 600px.
Verify no horizontal scroll.
Verify Trip screen map moves below content below 900px.
Verify hero cards stack vertically below 600px.

---

---

## The Order Matters — Dependency Graph

```
Phase 0 (CSS + AppContext)
  └── Phase 1 (UserSelector)
        └── Phase 2 (Home form, test coords)
              └── Phase 3 (Nominatim autocomplete)
                    └── Phase 4 (Waiting screen)
                          └── Phase 5 (Trip screen, no map)
                                ├── Phase 6 (Leaflet map)
                                ├── Phase 7 (Summary screen)
                                └── Phase 8 (Modal + Banners)
                                      └── Phase 9 (Animations)
                                            └── Phase 10 (Polish)
```

**You can do Phase 6 and Phase 7 in parallel after Phase 5.**
Everything else is sequential.

---

## Before You Start Each Phase

Ask yourself these three questions:

1. What is this phase trying to prove works?
2. What is the simplest version of this that I can test?
3. What would a broken version of this look like?

If you cannot answer all three — you are not ready to start the phase.
Come back to the design system docs, re-read the relevant spec,
then answer the three questions.

---

## Red Flags During Implementation

If you notice any of these — stop and fix before continuing:

- A component has more than 150 lines → needs splitting
- You are copy-pasting styles between components → extract to CSS variable
- A useEffect has more than 2 dependencies → likely a structural issue
- A component is fetching data directly → should be in a hook or context
- You are using `!important` in CSS → your specificity is wrong
- A hardcoded hex color appears anywhere → replace with CSS variable
- `console.log` statements left in committed code → clean up

---

## End State

When Phase 10 is complete, your app will:

1. Render all 5 screens with real backend data
2. Apply the complete design system with no hardcoded values
3. Handle all lifecycle states including error and edge cases
4. Work on keyboard without a mouse
5. Animate correctly and respect reduced motion preferences
6. Recover correctly on page refresh
7. Be explainable component by component in a technical interview

