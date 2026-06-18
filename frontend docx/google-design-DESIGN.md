---
version: alpha
name: "Google Design Editorial Dark"
description: "Primary visual anchor uses #000000 with accent, interactive states, and foreground tokens per css variables --theme-accent / --theme-accent-active. Typography baseline relies on Roboto Flex for hero article headline — largest display size, ultra-heavy weight."
colors:
  ink-black: "#000000"
  glimmer-yellow: "#fae366"
  nav-scrim: "#000000"
  surface-base: "#12110c"
  pure-white: "#ffffff"
  warm-charcoal: "#32302a"
typography:
  display-hero:
    fontFamily: "Roboto Flex"
    fontSize: "64.8889px"
    fontWeight: "800"
    lineHeight: "77.8667px"
  display-large:
    fontFamily: "Roboto Flex"
    fontSize: "44.4444px"
    fontWeight: "800"
    lineHeight: "53.3333px"
    letterSpacing: "-0.5px"
  display-medium:
    fontFamily: "Roboto Flex"
    fontSize: "27.1111px"
    fontWeight: "800"
    lineHeight: "32.5333px"
    letterSpacing: "-0.25px"
  display-small:
    fontFamily: "Roboto Flex"
    fontSize: "22.4444px"
    fontWeight: "800"
    lineHeight: "29.1778px"
  display-xs:
    fontFamily: "Roboto Flex"
    fontSize: "20px"
    fontWeight: "800"
    lineHeight: "28px"
  heading-h2:
    fontFamily: "Roboto"
    fontSize: "32px"
    fontWeight: "700"
    lineHeight: "48px"
  body-large:
    fontFamily: "Roboto"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  body-medium:
    fontFamily: "Roboto"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "16px"
  label-medium:
    fontFamily: "Roboto"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "14px"
  label-spaced:
    fontFamily: "Roboto"
    fontSize: "16px"
    fontWeight: "500"
    lineHeight: "24px"
    letterSpacing: "0.5px"
  display-jumbo:
    fontFamily: "Roboto"
    fontSize: "40px"
    fontWeight: "400"
rounded:
  radius-pill: "100px"
  radius-card: "8px"
  radius-button: "16px"
  radius-jumbo-pill: "420px"
spacing:
  spacing-1: "4px"
  spacing-2: "5px"
  spacing-3: "8px"
  spacing-4: "10px"
  spacing-5: "16px"
  spacing-6: "20px"
  spacing-7: "24px"
  spacing-8: "26.7px"
  spacing-9: "30px"
  spacing-10: "32px"
  spacing-11: "53.3px"
  spacing-12: "56px"
  spacing-13: "60px"
  spacing-14: "80px"
  spacing-15: "106.7px"
  spacing-16: "120px"
components:
  editorial-link:
    textColor: "rgb(255, 255, 255)"
    backgroundColor: "rgba(0, 0, 0, 0)"
    rounded: "0px"
    fontSize: "16px"
    fontWeight: "400"
  hero-article-hero:
    headingFontFamily: "Roboto Flex"
    headingFontSize: "64.8889px"
    headingFontWeight: "800"
    headingColor: "rgb(255, 255, 255)"
    backgroundColor: "rgba(0, 0, 0, 0)"
    layout: "50/50 split — text left, media right"
  media-control-pause:
    rounded: "{rounded.radius-pill}"
    backgroundColor: "{colors.nav-scrim}"
    textColor: "{colors.pure-white}"
    width: "~40px"
    height: "~40px"
  navigation:
    backgroundColor: "rgb(18, 17, 12)"
    textColor: "rgb(255, 255, 255)"
    rounded: "0px"
    boxShadow: "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px"
    fontSize: "16px"
  navigation-skim-overlay:
    backgroundColor: "rgba(0, 0, 0, 0.72)"
    textColor: "rgb(255, 255, 255)"
    rounded: "0px"
    boxShadow: "none"
  navigation-button-icon-button:
    textColor: "rgb(255, 255, 255)"
    backgroundColor: "rgba(0, 0, 0, 0)"
    rounded: "{rounded.radius-button}"
    borderWidth: "0px"
    padding: "0px"
    fontSize: "16px"
  navigation-layout-button-container:
    padding: "0px 53.3333px 0px 106.667px"
    backgroundColor: "rgba(0, 0, 0, 0)"
    textColor: "rgb(255, 255, 255)"
  story-card:
    rounded: "{rounded.radius-card}"
    backgroundColor: "{colors.surface-base}"
    headingFontFamily: "Roboto Flex"
    headingFontWeight: "800"
---

## Overview

Primary visual anchor uses #000000 with accent, interactive states, and foreground tokens per css variables --theme-accent / --theme-accent-active. Typography baseline relies on Roboto Flex for hero article headline — largest display size, ultra-heavy weight.

This system uses a 8px base grid with scale values 4, 5, 8, 10, 16, 20, 24, 26.7, 30, 32, 53.3, 56, 60, 80, 106.7, 120, 173.7.

**Signature traits:**
- Core token rhythm: Token evidence indicates consistent color, spacing, and radius rhythm across visible UI.

## Colors

The palette uses 6 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **surface-background** maps to `surface-base`: Role "background" is grounded by usage context "Primary page and navigation background — near-black warm tone".
- **action-text** maps to `pure-white`: Role "text" is grounded by usage context "All body text, headings, nav labels, links, and icon fills on dark surfaces".
- **content-primary** maps to `ink-black`: Role "primary" is grounded by usage context "Accent, interactive states, and foreground tokens per CSS variables --theme-accent / --theme-accent-active".
- **surface-border** maps to `warm-charcoal`: Role "border" is grounded by usage context "Checkbox, surface dividers, and subtle border treatments in header/footer zones".

### Primary Brand
- **Ink Black** (#000000): Accent, interactive states, and foreground tokens per CSS variables --theme-accent / --theme-accent-active. Role: primary.
- **Glimmer Yellow** (#fae366): Sparse accent highlight — used in header zone for branded callout or link emphasis. Role: accent.

### Text Scale
- **Pure White** (#ffffff): All body text, headings, nav labels, links, and icon fills on dark surfaces. Role: text.

### Interactive
- **Warm Charcoal** (#32302a): Checkbox, surface dividers, and subtle border treatments in header/footer zones. Role: border.

### Surface & Shadows
- **Nav Scrim** (#000000): Semi-transparent nav skim overlay (rgba 0,0,0,0.72) for scroll-state navigation. Role: background. {authored: #000000b8, alpha: 0.722}
- **Surface Base** (#12110c): Primary page and navigation background — near-black warm tone. Role: background.

## Typography

Typography uses Roboto Flex, Roboto across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes Roboto Flex and Roboto for visual contrast. Weight range spans bold, regular, medium. Sizes range from 14px to 64.8889px.

### Font Roles
- **Headline Font**: Roboto
- **Body Font**: Roboto

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero article headline — largest display size, ultra-heavy weight | Roboto Flex | 64.8889px | 800 | 77.8667px | normal | Roboto Flex, sans-serif; features: "kern", "liga" | Extracted token |
| Section headings and feature article titles | Roboto Flex | 44.4444px | 800 | 53.3333px | -0.5px | Roboto Flex, sans-serif; features: "kern", "liga" | Extracted token |
| Sub-section headings and card titles | Roboto Flex | 27.1111px | 800 | 32.5333px | -0.25px | Roboto Flex, sans-serif; features: "kern", "liga" | Extracted token |
| Tertiary headings and article card labels | Roboto Flex | 22.4444px | 800 | 29.1778px | normal | Roboto Flex, sans-serif; features: "kern", "liga" | Extracted token |
| Small display labels and callout headings | Roboto Flex | 20px | 800 | 28px | normal | Roboto Flex, sans-serif; features: "kern", "liga" | Extracted token |
| Article section headings | Roboto | 32px | 700 | 48px | normal | Roboto, sans-serif; features: "kern", "liga" | Extracted token |
| Primary body copy, navigation labels, and UI text | Roboto | 16px | 400 | 24px | normal | Roboto, sans-serif; features: "kern", "liga" | Extracted token |
| Secondary body text, captions, and metadata | Roboto | 14px | 400 | 16px | normal | Roboto, sans-serif; features: "kern", "liga" | Extracted token |
| Button labels, nav items, and UI control text | Roboto | 14px | 500 | 14px | normal | Roboto, sans-serif; features: "kern", "liga" | Extracted token |
| Uppercase-style labels with tracked spacing for category tags | Roboto | 16px | 500 | 24px | 0.5px | Roboto, sans-serif; features: "kern", "liga" | Extracted token |
| Large decorative or pull-quote text | Roboto | 40px | 400 | normal | normal | Roboto, sans-serif; features: "kern", "liga" | Extracted token |

## Layout

Responsive system uses 4 breakpoint tier(s): mobile, tablet, desktop, wide.

### Responsive Strategy
- **mobile (<= 1023px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (768-767px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (>= 1024px)**: Expand layout density and horizontal composition for wide viewports.
- **wide (>= 1920px)**: Stretch composition with generous gutters and wider layout spans.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| spacing-1 | 4px | 4 | Extracted spacing token |
| spacing-2 | 5px | 5 | Extracted spacing token |
| spacing-3 | 8px | 8 | Extracted spacing token |
| spacing-4 | 10px | 10 | Extracted spacing token |
| spacing-5 | 16px | 16 | Extracted spacing token |
| spacing-6 | 20px | 20 | Extracted spacing token |
| spacing-7 | 24px | 24 | Extracted spacing token |
| spacing-8 | 26.7px | 26.7 | Extracted spacing token |
| spacing-9 | 30px | 30 | Extracted spacing token |
| spacing-10 | 32px | 32 | Mapped to --gap |
| spacing-11 | 53.3px | 53.3 | Extracted spacing token |
| spacing-12 | 56px | 56 | Extracted spacing token |
| spacing-13 | 60px | 60 | Extracted spacing token |
| spacing-14 | 80px | 80 | Extracted spacing token |
| spacing-15 | 106.7px | 106.7 | Extracted spacing token |
| spacing-16 | 120px | 120 | Extracted spacing token |
| spacing-17 | 173.7px | 173.7 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| nav-elevation | 2 | 0px 1px 2px 0px rgba(60, 64, 67, 0.3) |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | outline-color | rgb(255, 255, 255) ; rgb(0, 0, 0) ; rgba(0, 0, 0, 0) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(1, 0, 0, 1, 0, 10.6656) ; matrix(1, 0, 0, 1, 0, 165.738) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-card | 8px | 8 | Control corner |
| radius-button | 16px | 16 | Card corner |
| radius-pill | 100px | 100 | Large surface corner |
| radius-jumbo-pill | 420px | 420 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-pill | 100px | px |
| radius-card | 8px | px |
| radius-button | 16px | px |
| radius-jumbo-pill | 420px | px |

## Components

Components should be recreated from token references first, then tuned with variant notes and probe-backed state guidance.
- **Navigation Bar**: Fixed top navigation bar with dark background (#12110c), white wordmark, search icon, and hamburger menu. Carries a two-layer Google-style elevation shadow on scroll.
- **Hero Section**: Full-viewport split layout: large Roboto Flex w800 display heading on the left, full-bleed media (video/image) on the right. Subtitle in Roboto 16px w400.
- **Nav Button**: Icon-only circular nav controls (search, hamburger) rendered as pill-radius interactive targets in the navigation bar.
- **Nav Button Container**: Container holding nav action buttons with asymmetric horizontal padding creating the nav's right-side button cluster.
- **Article Link**: Inline and standalone links rendered in white on dark backgrounds, no underline by default, with hover state driven by --links-hover-custom.
- **Video Pause Button**: Circular pill-shaped media control button overlaid on video content, white fill on dark circular background.
- **Article Card**: Editorial content cards with 8px border radius, used in article listing grids. Contain media thumbnail, category label, and headline.

### Editorial Link

**Default**
- textColor: rgb(255, 255, 255)
- backgroundColor: rgba(0, 0, 0, 0)
- rounded: 0px
- fontSize: 16px
- fontWeight: 400
- State guidance: Probe-confirmed: a.js-focusable-element

### Hero

**Article Hero**
- headingFontFamily: Roboto Flex
- headingFontSize: 64.8889px
- headingFontWeight: 800
- headingColor: rgb(255, 255, 255)
- backgroundColor: rgba(0, 0, 0, 0)
- layout: 50/50 split — text left, media right
- State guidance: Probe-confirmed heading: h2.heading at 64.8889px w800

### Media Control

**Pause**
- rounded: 100px
- backgroundColor: #000000
- textColor: #ffffff
- width: ~40px
- height: ~40px
- State guidance: Visually confirmed in screenshot — pill radius 100px consistent with CSSOM top radius

### Navigation

**Default**
- backgroundColor: rgb(18, 17, 12)
- textColor: rgb(255, 255, 255)
- rounded: 0px
- boxShadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px
- fontSize: 16px
- State guidance: Probe-confirmed: Navigation_background__dYlvH

**Skim Overlay**
- backgroundColor: rgba(0, 0, 0, 0.72)
- textColor: rgb(255, 255, 255)
- rounded: 0px
- boxShadow: none
- State guidance: Probe-confirmed: Navigation_nav__skim__nGmHh — semi-transparent scroll state

### Navigation Button

**Icon Button**
- textColor: rgb(255, 255, 255)
- backgroundColor: rgba(0, 0, 0, 0)
- rounded: 16px
- borderWidth: 0px
- padding: 0px
- fontSize: 16px
- State guidance: Probe-confirmed: div.js-cursor-target — borderRadius 16px, no border, transparent bg

### Navigation Layout

**Button Container**
- padding: 0px 53.3333px 0px 106.667px
- backgroundColor: rgba(0, 0, 0, 0)
- textColor: rgb(255, 255, 255)
- State guidance: Probe-confirmed: Navigation_nav__button__66hg2 — asymmetric padding

### Story Card

**Default**
- rounded: 8px
- backgroundColor: #12110c
- headingFontFamily: Roboto Flex
- headingFontWeight: 800
- State guidance: 8px radius confirmed in CSSOM frequency (35 hits)

## Do's and Don'ts

Guardrails protect Core token rhythm without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 472px | (max-width: 472px) |
| Mobile | <= 767px | (max-width: 767px) |
| Breakpoint 3 | <= 1023px | (max-width: 1023px) |
| Mobile | 768-767px | (max-width: 767px) and (min-width: 768px) |
| Tablet | >= 768px | (min-width: 768px) |
| Tablet | >= 769px | (min-width: 769px) |
| Desktop | >= 1024px | (min-width: 1024px) |
| Desktop | >= 1920px | (min-width: 1920px) |
| Breakpoint 9 | Unknown | (hover: hover) |

## Agent Prompt Guide

### Example Component Prompts
- Create Article Card variant that preserves Editorial content cards with 8px border radius, used in article listing grids. Contain media thumbnail, category label, and headline..
- Create Article Link variant that preserves Inline and standalone links rendered in white on dark backgrounds, no underline by default, with hover state driven by --links-hover-custom..
- Create Hero Section variant that preserves Full-viewport split layout: large Roboto Flex w800 display heading on the left, full-bleed media (video/image) on the right. Subtitle in Roboto 16px w400..

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
