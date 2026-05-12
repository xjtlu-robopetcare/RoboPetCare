---
name: Empathetic Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#54433a'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#877368'
  outline-variant: '#dac2b5'
  surface-tint: '#944a16'
  primary: '#944a16'
  on-primary: '#ffffff'
  primary-container: '#ff9f64'
  on-primary-container: '#773400'
  inverse-primary: '#ffb68c'
  secondary: '#006a6a'
  on-secondary: '#ffffff'
  secondary-container: '#97eeee'
  on-secondary-container: '#006e6e'
  tertiary: '#725a3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#d0b191'
  on-tertiary-container: '#5a432a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68c'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#753400'
  secondary-fixed: '#9af1f1'
  secondary-fixed-dim: '#7ed5d4'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f50'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#e1c1a0'
  on-tertiary-fixed: '#291804'
  on-tertiary-fixed-variant: '#59432a'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 20px
---

## Brand & Style

The brand personality focuses on the intersection of professional veterinary-grade monitoring and the emotional warmth of pet ownership. This design system bridges the gap between a high-tech health tool and a lifestyle companion. The target audience—busy professionals—requires a UI that prioritizes efficiency and reassurance through high legibility and an uncluttered interface.

The visual style is **Corporate / Modern** with a **Minimalist** overlay. It utilizes generous whitespace to reduce cognitive load while employing warm color accents to maintain an approachable, friendly atmosphere. Every interaction should feel intentional, calm, and reliable.

## Colors

The palette is designed to balance emotional warmth with clinical reliability. 
- **Soft Orange** (Primary) is used for active states, primary actions, and branding elements to evoke friendliness and vitality.
- **Teal** (Secondary) serves as the "professional" anchor, used for health data, medical alerts, and navigation to provide a sense of calm and expertise.
- **Neutral Gray** is used for structural elements and secondary text to maintain balance.
- **Surface Colors** utilize a range of off-whites and very light grays to define sections without the harshness of pure black-on-white contrast.

## Typography

This design system uses **Lexend** for headlines to leverage its hyper-legible, rhythmic qualities which are optimized for quick scanning of health metrics. **Plus Jakarta Sans** is used for body copy and labels; its soft, rounded terminals reinforce the welcoming and optimistic tone of the product.

Hierarchy is established primarily through weight and size rather than color shifts, ensuring that important health alerts and navigation points are immediately obvious to a user on the go.

## Layout & Spacing

This design system follows a **fluid grid** model based on an 8px square rhythm. For mobile interfaces, a 4-column layout is used, while desktop views expand to a 12-column grid. 

Margins are kept wide to prevent the interface from feeling cramped. Content is organized into clear vertical stacks with consistent padding (16px–24px) inside containers to ensure that touch targets are generous and that the "clean" minimalist aesthetic is preserved.

## Elevation & Depth

Visual hierarchy is managed through **tonal layers** and **ambient shadows**. Instead of heavy shadows, this design system uses soft, diffused shadows with a slight Teal or Orange tint (depending on the context) to make elements feel integrated into the environment rather than floating above it.

- **Level 0 (Surface):** The background layer, using the lightest neutral tint.
- **Level 1 (Cards/Lists):** White surfaces with a very soft, 10% opacity shadow.
- **Level 2 (Modals/Popovers):** Higher contrast shadows (15% opacity) to signify immediate importance.
Subtle 1px borders in a light gray are often used in conjunction with shadows to define boundaries clearly without adding visual noise.

## Shapes

The shape language is defined as **Rounded**. A base corner radius of 0.5rem (8px) is applied to standard buttons and input fields, while larger containers like cards use 1rem (16px). 

This level of roundedness strikes a balance: it is friendly and "pet-safe," avoiding the clinical sharpness of right angles, but remains more professional and structured than fully pill-shaped "playful" designs. Circles are reserved exclusively for avatars and status indicators.

## Components

**Buttons**
Primary buttons utilize a solid Soft Orange fill with white text. Secondary buttons use a Teal outline with Teal text for a professional, clinical look. All buttons have a minimum height of 48px to accommodate busy users.

**Cards**
Cards are the primary container for pet health data. They feature a white background, 16px rounded corners, and a subtle Level 1 shadow. Headers within cards should use Teal text to denote a "medical" section.

**Chips & Status Indicators**
Use Teal for "Normal" or "Healthy" states, Soft Orange for "Pending" or "Reminder" states, and a soft red for "Alerts." Chips should have fully rounded (pill) ends to differentiate them from actionable buttons.

**Inputs**
Text fields feature a light gray stroke that thickens and changes to Teal on focus. Labels are always persistent above the field in a semi-bold weight to ensure clarity during data entry.

**Health Gauges**
Progress bars and activity rings should use a combination of Teal and Soft Orange to visualize daily goals (e.g., activity levels or hydration). These should be thick and high-contrast for readability at a glance.