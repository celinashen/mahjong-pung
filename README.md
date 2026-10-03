# pung!

A mobile-first mahjong score calculator for **Hong Kong** and **Chinese Official (MCR)** rules.

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # scoring engine tests
npm run build
```

## Features

### P0 (built)
1. Choose a variant — Hong Kong or Chinese (MCR). Remembered across "New hand" and reloads.
2. Build a hand from a tile picker: single tiles, claimed Chow / Pung / Kong, and concealed kongs.
3. Mark the winning tile (defaults to the tile that completes the hand).
4. Add flowers and seasons.
5. Set win conditions: self-drawn vs discard, seat wind, round wind, plus variant-specific
   flags (last tile, kong replacement, robbing the kong, last of its kind, Heaven/Earth/Man).
   Concealed/open is worked out from the sets you claimed.
6. HK table rules: minimum fan (0/1/3) and whether Seven Pairs is allowed.
7. Calculate: total fan/points, every scoring combo with its English + Chinese name, points,
   and why it applied; how the hand was split into sets; and who pays what.
8. New hand: clears the hand, keeps the variant, winds and table rules.
9. Multi-select tiles in your hand to remove several at once.
10. "How to play" sheet (the ? button): TL;DR, set-up, turns, claiming, scoring and payment,
    plus the full scoring list for each variant (generated from the engine's tables).
11. English / Traditional Chinese toggle (EN / 中 in the top bar): UI, scoring explanations,
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
  `hk.ts`, `mcr.ts`, tests in `engine.test.ts`.
- `src/state.ts` — app state, reducer, localStorage persistence.
- `src/components/` — UI.
