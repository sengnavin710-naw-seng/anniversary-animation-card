# Project Context

## Overview

This repository currently contains a front-end interactive animation prototype. It presents a pink, heart-themed **"Happy Anniversary 3 Years"** experience with a loading sequence, a `1 → 2 → 3` transition, and a drag-to-unlock interaction that reveals an image and a typed note.

The long-term product direction is different from the current prototype: the project is intended to become a commercial product for both men and women. Visitors should be able to explore the public site, while registered members will receive full access to the custom tools or programs offered by the business.

Keep the distinction between the **current implemented prototype** and the **future business product** clear. Do not describe planned functionality as if it already exists.

## Current Status

- Stage: front-end visual prototype / proof of concept.
- The app is fully client-side; there is no backend, database, authentication, payment flow, user account, or role enforcement.
- The present content is a fixed anniversary experience, not yet a generic, data-driven product.
- The root `README.md` is the default Vite template and does not document this application.
- Existing uncommitted work may be present. Preserve it unless a task explicitly requests changes to it.

## Implemented Experience

1. A loading screen animates a heart, progress indicator, sparkles, and burst particles.
2. The application automatically shows the numbers `1`, `2`, and `3` in sequence, each with animated hearts and a changing background.
3. A user drags the unlock card downward. Releasing it after a sufficiently long downward drag starts the reveal sequence.
4. The reveal sequence types the anniversary title, animates a heart into an image, expands a notebook-style note, and types a placeholder message.

The anniversary title and note are currently hard-coded in `src/components/CuteUnlockSlider.tsx`. The note is placeholder Lorem Ipsum content.

## Technology

- React 18 with TypeScript
- Vite 8
- Tailwind CSS 3 with a custom `blossom` pink palette
- `@react-spring/web` for animation
- `@use-gesture/react` for the drag interaction
- Additional installed libraries include GSAP, Lottie React, Lucide React, and Zustand; they are not currently used by the application source.

## Repository Layout

```text
pink-animated-site/
├── src/
│   ├── App.tsx                         # Coordinates the loading, number, and unlock stages
│   ├── index.css                       # Tailwind imports and shared base styles
│   ├── assets/                         # Anniversary image and notebook-card artwork
│   └── components/
│       ├── AnimatedBackground.tsx      # Crossfading gradient backgrounds
│       ├── LoadingScreen.tsx           # Initial loading animation
│       ├── NumberTrail.tsx             # 1 → 2 → 3 transition animation
│       ├── CuteUnlockSlider.tsx        # Main drag-to-unlock and reveal experience
│       └── AnniversaryScreen.tsx       # Standalone anniversary card; not rendered by App
├── public/                             # Static SVG assets
├── tailwind.config.js                  # Theme colors and font families
├── vite.config.ts                      # Vite configuration
└── package.json                        # Scripts and dependencies
```

The workspace also contains top-level `images/` and `font/` directories outside the Vite app. They are not imported by the current source code.

## Local Development

Run these commands from the `pink-animated-site` directory:

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
npm run preview
```

`npm run build` runs TypeScript project compilation and then creates the Vite production build.

## Product Direction and Access Model

The intended product model is:

| Visitor type | Intended access |
| --- | --- |
| Unregistered visitor | Can view the public site and only use limited features. |
| Registered member | Can use the product's tools and features fully. |
| Administrator | Planned future role for managing the service. |

The exact feature list, membership plans, pricing, and permissions have not yet been defined. Avoid inventing them without a product decision.

## Planned Work

Future development is expected to include:

- A public Home page
- Registration and sign-in flows
- An admin area
- A database
- Authentication and authorization
- Membership-aware feature restrictions
- Payment processing
- More product tools and features

Before implementing these items, decide the chosen backend/database provider, authentication provider, payment provider, data model, membership tiers, and exact access rules.

## Development Guidance

- Preserve the existing soft pink visual language and smooth, mobile-friendly interactions unless the product design changes.
- Keep animation timing and cleanup reliable. Components use timers and animation promises, so cancel timers and avoid state updates after unmounting.
- Prefer accessible semantic elements and clear English `aria` labels for future public-facing screens. Some existing labels are in Thai and may be revised during localization.
- Do not add secrets, payment keys, database URLs, or other credentials to this repository or this document. Use environment variables once external services are introduced.
- Convert hard-coded copy and media into configurable content only when the broader product requirements are defined.

## Known Gaps

- No routing, responsive product pages, navigation, forms, or user persistence exist yet.
- No tests are configured.
- No deployment configuration or environment-variable example file exists.
- The default README should eventually be replaced with product-specific setup and deployment documentation.
