{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;\red230\green233\blue236;}
{\*\expandedcolortbl;;\cssrgb\c0\c1\c1;\cssrgb\c92207\c92998\c94107;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs24 \cf2 \expnd0\expndtw0\kerning0
# CarpoolTU Component Specs \'97 Part 1\
## Foundation + Inputs\
**Token Reference:** theme-tokens.json\
**Rule:** Every value references a token name, never a raw hex.\
\
---\
\
---\
\
# AppHeader\
\
## Purpose\
Persistent top bar present on every screen except User Selector.\
Communicates: what app this is, what state the user is in, who is acting.\
Must never draw attention away from the screen content below it.\
\
## Variants\
- `default` \'97 app name left, user switcher right, no status\
- `with-status` \'97 adds centered lifecycle status indicator\
  Used on: Trip screen only (TRIP ACTIVE indicator)\
\
## States\
\
**default**\
- Background: `color.background.primary`\
- Bottom border: 1px `color.outline.subtle`\
- No shadow \'97 elevation via border only\
\
**scrolled** (when page content scrolls behind it)\
- Background: `color.background.primary` at 92% opacity\
- Backdrop blur: 12px\
- Bottom border remains\
\
## Layout Rules\
- Height: 56px fixed\
- Full viewport width\
- Content constrained to same max-width as page content (760px centered)\
- Three zones: left / center / right\
- Left zone: app wordmark\
- Center zone: lifecycle status (only on Trip screen)\
- Right zone: user switcher\
\
**Left zone \'97 App Wordmark**\
- "CarpoolTU" text\
- Font: `typography.label` (13px DM Sans 500)\
- Color: `color.text.secondary`\
- Not a link on active screens\
- On User Selector screen: larger, `typography.headline` (22px DM Sans 600), `color.text.primary`\
\
**Center zone \'97 Lifecycle Status**\
- Only renders when `uiState === 'TRIP_ACTIVE'`\
- Green dot: 8px circle, `color.semantic.success`\
- Label: "TRIP ACTIVE"\
- Font: `typography.caption` (11px DM Sans 500)\
- Letter spacing: 0.05em\
- Color: `color.semantic.success`\
- Dot and label inline, gap: `spacing.1` (4px)\
\
**Right zone \'97 User Switcher**\
- Format: "\{UserName\} \uc0\u9662 "\
- Font: `typography.label` (13px DM Sans 500)\
- Color: `color.text.secondary`\
- Chevron: 12px, same color\
- Hover: color shifts to `color.text.primary`, 200ms\
- Click: dispatches user switch flow (returns to User Selector)\
\
## Accessibility Rules\
- Role: `banner` (landmark)\
- App name has `aria-label="CarpoolTU home"`\
- Status indicator has `aria-live="polite"` \'97 announces state changes to screen readers\
- User switcher is a `<button>` not a `<div>`\
- Focus ring: 2px `color.outline.focus`, 2px offset\
\
## Animation Rules\
- On scroll: backdrop blur fades in over 200ms `motion.easing.standard`\
- Status indicator appearance: fade in 300ms when TRIP_ACTIVE state begins\
- Status indicator disappearance: fade out 200ms\
\
## Token Usage Summary\
```\
color.background.primary     \uc0\u8594  header background\
color.outline.subtle         \uc0\u8594  bottom border\
color.text.secondary         \uc0\u8594  wordmark, user name\
color.text.primary           \uc0\u8594  hover state\
color.semantic.success       \uc0\u8594  status dot and label\
color.outline.focus          \uc0\u8594  focus ring\
typography.label             \uc0\u8594  wordmark, user name\
typography.caption           \uc0\u8594  status label\
spacing.1                    \uc0\u8594  dot-to-label gap\
```\
\
---\
\
---\
\
# Divider\
\
## Purpose\
Horizontal rule separating content sections within a screen or card.\
Does structural work \'97 creates rhythm and grouping without adding visual weight.\
Never decorative. Every divider separates two meaningfully distinct sections.\
\
## Variants\
- `full` \'97 spans full width of its container\
- `inset` \'97 has 16px left indent, used inside list items to separate rows\
  without cutting across the left-aligned icon or dot\
\
## States\
Dividers have no interactive states.\
\
## Layout Rules\
- Height: 1px\
- Color: `color.outline.subtle`\
- Margin: `spacing.6` (24px) above and below when between major sections\
- Margin: `spacing.4` (16px) above and below when between rows inside a card\
- Never add margin to the divider itself \'97 margin belongs to the surrounding sections\
- `inset` variant: `margin-left: spacing.4` (16px)\
\
## Accessibility Rules\
- Rendered as `<hr>` element\
- `aria-hidden="true"` \'97 purely visual, not meaningful to screen readers\
\
## Animation Rules\
None. Dividers do not animate.\
\
## Token Usage Summary\
```\
color.outline.subtle    \uc0\u8594  line color\
spacing.6               \uc0\u8594  section-level margin context\
spacing.4               \uc0\u8594  row-level margin context\
```\
\
---\
\
---\
\
# NotificationBanner\
\
## Purpose\
Non-blocking message that appears at the top of the content area.\
Communicates: errors, warnings, re-queue events, network issues.\
Never blocks interaction. Never a modal. Never full-screen.\
\
The user must always be able to read it and continue what they were doing.\
\
## Variants\
- `error` \'97 network failure, submit failure\
- `warning` \'97 co-rider cancelled, re-queue, expiry approaching\
- `info` \'97 duplicate request detected, general system messages\
- `success` \'97 rarely used, only for explicit positive confirmations\
\
## States\
\
**visible**\
- Slides down from top of content area\
- Full content width\
- Sits above all content, below AppHeader\
\
**dismissing**\
- Slides up and fades out\
- Triggered by: user dismiss, auto-timeout (success/info only), state change\
\
## Layout Rules\
- Width: full content column width (760px max, centered)\
- Min height: 48px\
- Padding: `spacing.4` (16px) horizontal, `spacing.3` (12px) vertical\
- Border radius: `radius.sm` (8px)\
- Display: flex, space-between, vertically centered\
- Left: icon (16px) + message text, gap `spacing.2` (8px)\
- Right: dismiss button (\uc0\u10005 ), 24\'d724px tap target\
\
**Variant backgrounds and colors:**\
- `error`: background `color.semantic.error_dim`, left border 3px `color.semantic.error`\
- `warning`: background `color.semantic.warning_dim`, left border 3px `color.semantic.warning`\
- `info`: background `color.accent.dim`, left border 3px `color.accent.primary`\
- `success`: background `color.semantic.success_dim`, left border 3px `color.semantic.success`\
\
**Message text:**\
- Font: `typography.body` (15px DM Sans 400)\
- Color: `color.text.primary`\
\
**Optional action link** (e.g. "View it \uc0\u8594 "):\
- Font: `typography.body` (15px DM Sans 500)\
- Color: `color.accent.primary`\
- Inline with message text, separated by space\
\
## Persistence Rules\
- `error`: persists until dismissed. Never auto-hides.\
- `warning`: persists until dismissed or state changes.\
- `info`: auto-hides after 5000ms OR until dismissed.\
- `success`: auto-hides after 3000ms.\
\
Only one banner visible at a time.\
If two events fire simultaneously: show higher severity only.\
Priority: error > warning > info > success\
\
## Accessibility Rules\
- Role: `alert` for error and warning variants\
- Role: `status` for info and success variants\
- `aria-live="assertive"` for error, `aria-live="polite"` for others\
- Dismiss button: `aria-label="Dismiss notification"`\
- Message text is the accessible name \'97 no icon-only messaging\
\
## Animation Rules\
- Entrance: `translateY(-100%)` \uc0\u8594  `translateY(0)`, opacity 0\u8594 1\
  Duration: `motion.duration.standard` (300ms)\
  Easing: `motion.easing.decelerate`\
- Exit: `translateY(-100%)`, opacity 1\uc0\u8594 0\
  Duration: `motion.duration.fast` (200ms)\
  Easing: `motion.easing.accelerate`\
\
## Token Usage Summary\
```\
color.semantic.error_dim      \uc0\u8594  error background\
color.semantic.error          \uc0\u8594  error border + icon\
color.semantic.warning_dim    \uc0\u8594  warning background\
color.semantic.warning        \uc0\u8594  warning border + icon\
color.accent.dim              \uc0\u8594  info background\
color.accent.primary          \uc0\u8594  info border + icon + action link\
color.semantic.success_dim    \uc0\u8594  success background\
color.semantic.success        \uc0\u8594  success border + icon\
color.text.primary            \uc0\u8594  message text\
typography.body               \uc0\u8594  message text\
radius.sm                     \uc0\u8594  border radius\
spacing.4                     \uc0\u8594  horizontal padding\
spacing.3                     \uc0\u8594  vertical padding\
spacing.2                     \uc0\u8594  icon-to-text gap\
motion.duration.standard      \uc0\u8594  entrance duration\
motion.duration.fast          \uc0\u8594  exit duration\
motion.easing.decelerate      \uc0\u8594  entrance easing\
motion.easing.accelerate      \uc0\u8594  exit easing\
```\
\
---\
\
---\
\
# LocationInputCard\
\
## Purpose\
The primary form element on the Home screen.\
Contains pickup location, drop location, and date/time \'97 unified into one card.\
This is a Material Expressive "container" \'97 three related inputs feel like one decision,\
not three separate form fields.\
\
The card communicates: "tell me your journey" as a single thought.\
\
## Variants\
- `idle` \'97 no input focused, both fields empty\
- `pickup-active` \'97 pickup field focused, autocomplete open\
- `drop-active` \'97 drop field focused, autocomplete open\
- `complete` \'97 both locations selected, date set \'97 ready to submit\
\
## States\
\
**idle**\
- Card background: `color.surface.default`\
- Card border: 1px `color.outline.default`\
- Card radius: `radius.lg` (16px)\
- Both input rows show placeholder text\
\
**any-field-focused**\
- Card border: 1px `color.outline.focus` (accent color)\
- Card background: unchanged\
- Focused row has subtle background lift: `color.surface.container`\
- Transition: 200ms `motion.easing.standard`\
\
**complete** (both locations filled + date set)\
- Card border: 1px `color.outline.default` \'97 returns to default\
- Pickup dot color: `color.accent.primary`\
- Drop dot color: `color.semantic.error` (red destination dot \'97 universal convention)\
- Both dots filled (solid circle vs empty circle in idle)\
\
**error** (validation failed)\
- Card border: 1px `color.semantic.error`\
- Error message appears below card, not inside it\
- Card itself does not shake or flash \'97 calm error presentation\
\
## Layout Rules\
\
```\
\uc0\u9484 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9488 \
\uc0\u9474   \u9675   Pickup location placeholder             \u9474   \u8592  LocationInputRow\
\uc0\u9474      \u9472  \u9472  \u9472  \u9472  \u9472  \u9472  (connector line)           \u9474   \u8592  visual connector\
\uc0\u9474   \u9679   Drop location placeholder               \u9474   \u8592  LocationInputRow\
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508   \u8592  internal divider (1px outline.subtle)\
\uc0\u9474   \u55357 \u56517   Date and time                          \u9474   \u8592  DateTimeRow\
\uc0\u9492 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9496 \
```\
\
- Card padding: `spacing.4` (16px) all sides\
- LocationInputRow height: 48px each\
- Connector line: between pickup dot and drop dot, left-aligned with dots\
  Height: 24px, style: dashed 1px `color.outline.default`\
  This visually connects pickup\uc0\u8594 drop inside the card\
- Internal divider: between location section and date section\
  1px `color.outline.subtle`, full card width minus padding\
- DateTimeRow height: 48px\
\
## Accessibility Rules\
- Card itself: `role="group"`, `aria-label="Journey details"`\
- Each input inside is individually labelled (see LocationInputRow)\
- Tab order: pickup \uc0\u8594  drop \u8594  date \u8594  submit button\
- Error message: `role="alert"`, associated with card via `aria-describedby`\
\
## Animation Rules\
- Border color transition on focus: 200ms `motion.easing.standard`\
- Connector line: when pickup is filled, line color transitions to\
  `color.accent.primary` at 40% opacity \'97 subtle confirmation\
  Duration: 300ms `motion.easing.standard`\
- No card-level entrance animation \'97 it is always present on Home screen\
\
## Token Usage Summary\
```\
color.surface.default       \uc0\u8594  card background\
color.surface.container     \uc0\u8594  focused row background\
color.outline.default       \uc0\u8594  default border\
color.outline.focus         \uc0\u8594  focused border\
color.outline.subtle        \uc0\u8594  internal divider, connector line\
color.accent.primary        \uc0\u8594  pickup dot (filled), focused border\
color.semantic.error        \uc0\u8594  drop dot (filled), error border\
radius.lg                   \uc0\u8594  card border radius\
spacing.4                   \uc0\u8594  card padding\
motion.duration.fast        \uc0\u8594  border transition\
motion.easing.standard      \uc0\u8594  all transitions\
```\
\
---\
\
---\
\
# LocationInputRow\
\
## Purpose\
Single input row inside LocationInputCard.\
Handles text input + Nominatim autocomplete trigger.\
Two instances per card: pickup and drop.\
\
## Variants\
- `pickup` \'97 left dot is accent colored circle\
- `drop` \'97 left dot is error colored circle\
\
## States\
\
**empty**\
- Dot: 10px circle, outline only (not filled), `color.outline.default`\
- Input text: placeholder style, `color.text.tertiary`\
\
**focused**\
- Row background: `color.surface.container`\
- Dot: filled circle, variant color (accent or error)\
- Input text: `color.text.primary`\
- Cursor visible\
\
**filled** (location selected from autocomplete)\
- Dot: filled circle, variant color\
- Input text: `color.text.primary`, full display name\
- Row background: returns to transparent\
\
**loading** (autocomplete searching)\
- Dot: pulse animation, variant color at 50% opacity cycling to 100%\
- Input shows typed text\
- No spinner inside input \'97 dot animation is sufficient\
\
## Layout Rules\
- Height: 48px\
- Padding: `spacing.4` (16px) horizontal\
- Left: dot (10px) + gap `spacing.3` (12px) + input text\
- Input takes remaining width\
- No visible input border \'97 the card provides the border\
- Input background: transparent\
- Font: `typography.body` (15px DM Sans 400)\
- Placeholder color: `color.text.tertiary`\
- Filled text color: `color.text.primary`\
\
## Accessibility Rules\
- `<label>` visually hidden but present: "Pickup location" / "Drop location"\
- Input `aria-label` matches label\
- Input `role="combobox"` when autocomplete is active\
- Input `aria-expanded="true/false"` based on dropdown state\
- Input `aria-autocomplete="list"`\
- Input `aria-controls` points to dropdown list id\
\
## Animation Rules\
- Dot fill: opacity 0\uc0\u8594 1 when location selected, 200ms\
- Row background: opacity 0\uc0\u8594 1 on focus, 150ms\
- Loading pulse: opacity 0.5\uc0\u8594 1\u8594 0.5, 900ms infinite linear\
\
## Token Usage Summary\
```\
color.surface.container     \uc0\u8594  focused row background\
color.outline.default       \uc0\u8594  empty dot border\
color.accent.primary        \uc0\u8594  pickup dot filled\
color.semantic.error        \uc0\u8594  drop dot filled\
color.text.primary          \uc0\u8594  filled input text\
color.text.tertiary         \uc0\u8594  placeholder text\
typography.body             \uc0\u8594  input text\
spacing.4                   \uc0\u8594  horizontal padding\
spacing.3                   \uc0\u8594  dot-to-input gap\
```\
\
---\
\
---\
\
# DateTimeRow\
\
## Purpose\
Date and time picker row inside LocationInputCard.\
Third row, below the internal divider.\
Uses browser native datetime-local input \'97 no custom date picker.\
Reason: native input has built-in accessibility, works across browsers,\
requires zero custom code for the calendar/clock UI.\
\
## Variants\
Single variant only \'97 date and time combined in one field.\
\
## States\
\
**default**\
- Shows formatted placeholder: "When do you want to leave?"\
- Icon: calendar icon, 16px, `color.text.tertiary`\
\
**filled**\
- Shows formatted date: "Tuesday, Jun 10 \'b7 6:30 PM"\
- Icon color shifts to `color.accent.primary`\
- Text color: `color.text.primary`\
\
**focused**\
- Row background: `color.surface.container`\
- Border inherited from card focus state\
\
**invalid** (time in the past)\
- Text color: `color.semantic.error`\
- Icon color: `color.semantic.error`\
- Error shown below card, not inline\
\
## Layout Rules\
- Height: 48px\
- Padding: `spacing.4` (16px) horizontal\
- Left: calendar icon (16px) + gap `spacing.3` (12px) + date text\
- Native input overlaid invisibly over full row \'97 clicking anywhere triggers picker\
- Formatted display text renders on top of native input (native input opacity: 0)\
- This pattern: visible styled div + invisible native input stacked\
\
## Formatting Rule\
Raw datetime-local value: "2026-06-10T18:30"\
Display format: "Tuesday, Jun 10 \'b7 6:30 PM"\
Use `Intl.DateTimeFormat` for formatting \'97 no external library needed.\
\
## Accessibility Rules\
- Native `<input type="datetime-local">` is the actual interactive element\
- Visible formatted text is `aria-hidden="true"`\
- Native input has `aria-label="Preferred departure time"`\
- Min value set to `now - 5 minutes` (matches backend validator)\
\
## Animation Rules\
- Icon color transition on fill: 200ms `motion.easing.standard`\
- Row background on focus: 150ms\
\
## Token Usage Summary\
```\
color.surface.container     \uc0\u8594  focused row background\
color.text.tertiary         \uc0\u8594  default icon color\
color.text.primary          \uc0\u8594  filled text\
color.accent.primary        \uc0\u8594  filled icon color\
color.semantic.error        \uc0\u8594  invalid state\
typography.body             \uc0\u8594  display text\
spacing.4                   \uc0\u8594  horizontal padding\
spacing.3                   \uc0\u8594  icon-to-text gap\
```\
\
---\
\
---\
\
# AutocompleteDropdown\
\
## Purpose\
Appears below LocationInputCard when user types in either location input.\
Shows Nominatim search results constrained to Patiala bounding box.\
Disappears when: result selected, input cleared, focus leaves card, ESC pressed.\
\
## Variants\
- `results` \'97 showing location results\
- `loading` \'97 search in progress\
- `empty` \'97 query entered but no results found\
\
## States\
\
**loading**\
- Single skeleton row, shimmer animation\
- Text: "Searching..." in `color.text.tertiary`\
\
**results**\
- List of up to 5 location results\
- Each result is a row\
\
**empty**\
- Single row: "No locations found"\
- Text: `color.text.tertiary`, centered\
\
**result-row default**\
- Background: transparent\
- Text: `color.text.primary` (primary display name)\
- Sub-text: shorter area name, `color.text.secondary`\
\
**result-row hover**\
- Background: `color.surface.container`\
- Transition: 150ms\
\
**result-row focused** (keyboard navigation)\
- Background: `color.surface.container`\
- Left border: 2px `color.accent.primary`\
\
**result-row active/pressed**\
- Background: `color.background.tertiary`\
- Scale: none \'97 list items do not scale\
\
## Layout Rules\
- Position: absolute, below LocationInputCard\
- Width: matches LocationInputCard width exactly\
- Background: `color.surface.elevated`\
- Border: 1px `color.outline.default`\
- Border radius: `radius.md` (12px)\
- Max height: 240px, overflow-y: auto\
- Z-index: above all content, below AppHeader\
- Top margin: `spacing.1` (4px) from card bottom\
- Each result row: 52px height\
- Row padding: `spacing.4` (16px) horizontal, `spacing.3` (12px) vertical\
- Primary text: `typography.body` (15px DM Sans 400), `color.text.primary`\
- Sub-text: `typography.caption` (11px DM Sans 400), `color.text.secondary`\
- Sub-text appears below primary text, same left alignment\
\
**Display name trimming rule:**\
Nominatim returns long strings like:\
"Thapar Institute of Engineering and Technology, Bhadson Road, Prem Nagar, Patiala, Punjab, 147004, India"\
Trim to first two comma-separated segments:\
"Thapar Institute of Engineering and Technology, Bhadson Road"\
Sub-text: "Patiala, Punjab"\
\
## Accessibility Rules\
- Role: `listbox`\
- Each result: `role="option"`\
- Input `aria-controls` points to this listbox id\
- Selected result: `aria-selected="true"`\
- Arrow keys navigate between options\
- Enter selects focused option\
- ESC closes without selecting\
\
## Animation Rules\
- Entrance: height 0\uc0\u8594 auto, opacity 0\u8594 1\
  Duration: `motion.duration.fast` (200ms)\
  Easing: `motion.easing.decelerate`\
- Exit: opacity 1\uc0\u8594 0\
  Duration: `motion.duration.fast` (200ms)\
  Easing: `motion.easing.accelerate`\
- Row hover background: 150ms, no easing specification needed\
\
## Token Usage Summary\
```\
color.surface.elevated      \uc0\u8594  dropdown background\
color.surface.container     \uc0\u8594  row hover/focus background\
color.background.tertiary   \uc0\u8594  row pressed background\
color.outline.default       \uc0\u8594  dropdown border\
color.accent.primary        \uc0\u8594  focused row left border\
color.text.primary          \uc0\u8594  result primary text\
color.text.secondary        \uc0\u8594  result sub-text\
color.text.tertiary         \uc0\u8594  empty/loading text\
radius.md                   \uc0\u8594  dropdown border radius\
spacing.4                   \uc0\u8594  row horizontal padding\
spacing.3                   \uc0\u8594  row vertical padding\
spacing.1                   \uc0\u8594  gap between card and dropdown\
typography.body             \uc0\u8594  primary result text\
typography.caption          \uc0\u8594  sub-text, empty state text\
motion.duration.fast        \uc0\u8594  entrance + exit\
motion.easing.decelerate    \uc0\u8594  entrance\
motion.easing.accelerate    \uc0\u8594  exit\
```\
\
---\
\
## Part 1 Complete\
\
**7 components specified:**\
AppHeader \'b7 Divider \'b7 NotificationBanner \'b7 LocationInputCard \'b7 LocationInputRow \'b7 DateTimeRow \'b7 AutocompleteDropdown\
\
**What to check before Part 2:**\
- Every token reference exists in your theme-tokens.json\
- The LocationInputCard layout matches your mental image of the unified card\
- The AutocompleteDropdown display name trimming rule makes sense for Nominatim output\
- AppHeader center zone (lifecycle status) matches what you expect on the Trip screen\
}