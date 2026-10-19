# Pocket Mystery

An interactive detective game in Polish, played in the browser or installed on a phone. You take on the role of an investigator, question suspects in your own words and try to solve the crime before you run out of accusations. The game master is an AI, so there are no multiple-choice menus: you decide what to ask, whom to press and when to make your accusation.

**Live:** [pocketmystery.pl](https://www.pocketmystery.pl)

## What it is

- Original murder mysteries written by the author. Each case has its own suspects, alibis, clues and a hidden solution.
- A conversational game master (Claude, via the Anthropic API) that plays all the characters, stays inside the facts of the case and gives hints on a timer instead of handing out the answer.
- A notebook, a hint system and a limited number of accusations per case.
- Works as a progressive web app (PWA) on Android and iOS. A Google Play release (Trusted Web Activity) is planned.

## Why it is built this way

The game master only works if the player cannot read the solution, so everything that can spoil a case stays on the server:

- Case files (the "bible" with the solution) are loaded server-side only and are never sent to the browser.
- Every player move goes through the server, which calls the model, applies the case rules and records the cost of the move.
- Players can report an answer from the game master as wrong or inappropriate.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| AI | Anthropic API (Claude) with prompt caching, called from server routes only |
| Database & auth | Supabase (Postgres, email-link sign-in) |
| Email | Resend (SMTP) |
| Hosting | Vercel |
| Mobile | PWA with offline screen and service worker, prepared for TWA |

## Product and privacy

- Public sign-up with verified email addresses.
- Account deletion from inside the app.
- Explicit consent before conversations are processed by an AI service.
- Privacy policy and help pages.
- Per-move cost tracking and usage limits, so the AI bill stays predictable.

## How it was made

Pocket Mystery is my own product: the concept, game design, the case writing, the game master's rules and every product decision are mine. The code was written together with an AI coding assistant (Claude Code) working under my direction. I review the changes, run the database migrations myself and decide what ships.

## Status

In active development. Three cases are written; the first short case is planned to be free, with the rest behind a paywall. Google Play testing is the next milestone.

## Running it locally

This repository does not include the case files, the game master's instructions or any keys, so the game itself will not run from a plain checkout. If you would like to see it working, play it at [pocketmystery.pl](https://www.pocketmystery.pl) or contact me.

## License

All rights reserved. The source code and all game content are the property of the author. Reading the code for evaluation purposes is welcome; copying, redistribution or commercial use requires written permission.

## Contact

Maria Jaszczurowska · [maryleezard.com](https://maryleezard.com) · maryleezard@gmail.com
