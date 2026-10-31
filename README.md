# pung!

A mobile-first mahjong score calculator for **Hong Kong** and **Chinese Official (MCR)** rules.

**Live:** https://playpung.vercel.app — deployed on Vercel. Merges to `main` go to production; PRs get preview deployments.

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # scoring engine tests
npm run build
```

## Features

### P0 (built)
1. Game mode (top bar, opens its own sheet): Hong Kong or Chinese (MCR), whether the table counts
   flowers and winds, and the HK table rules (minimum fan 0/1/3, Seven Pairs allowed).
   Remembered across "New hand" and reloads.
2. Build a hand by dragging tiles up from a big, swipeable rail that's split by suit (a tap adds
   a tile too). Kongs are entered as all four tiles, so the hand grows past 14.
3. Remove a tile by tapping it, or by dragging it into the delete area that appears at the bottom.
4. Submit, and the hand is grouped into sets. Then one question at a time, skipping any that don't
   apply: which sets were revealed, the last tile, how you got it (self-drawn vs discard plus
   variant-specific flags), flowers, and seat and round wind. An ambiguous hand offers every set
   it could contain, and picking one rules out the sets that can't go with it.
5. Calculate: total fan/points, every scoring combo with its English + Chinese name, points,
   and why it applied; how the hand was split into sets; and who pays what.
6. New hand: clears the hand, keeps the game mode and winds.
7. HK wins on 7 or 8 flowers can be claimed without a complete hand.
8. "How to play" sheet (the ? button): TL;DR, set-up, turns, claiming, scoring and payment,
    plus the full scoring list for each variant (generated from the engine's tables).
9. English / Traditional Chinese toggle (EN / 中 in the top bar): UI, scoring explanations,
    payouts and the rulebook. Labels show the other language as a small subtitle. Remembered
    across reloads; first visit follows the phone's language.

### P2 (planned)
1. ~~English / Chinese language toggle~~ (done)
2. Accounts and sign-in.
3. Friends: add and remove.
4. Groups: create, leave.
5. Games: start a game in a group, everyone submits a hand, results revealed once all have submitted; start a new game.
6. Group leaderboard: games won per player, a who-owes-whom fan matrix, and total fan per player.
7. Photo of a hand → tile recognition to fill in the hand.

## Code map
- `src/engine/` — pure TypeScript scoring: `hand.ts` (hand model, decomposition, waits),
  `hk.ts`, `mcr.ts`, tests in `engine.test.ts` (and `src/state.test.ts`).
- `src/state.ts` — app state, reducer, localStorage persistence, flat hand → scoring input.
- `src/useTileDrag.ts` — touch and mouse drag and drop.
- `src/components/` — UI.
