import { ReactNode, useState } from 'react';
import { HK_FANS, HK_POINTS, MCR_FANS, Tile, Variant } from '../engine';
import { Sheet } from './Sheet';
import { TileFace } from './TileFace';

function Tiles({ tiles }: { tiles: Tile[] }) {
  return <span className="mini-tiles">{tiles.map((t, i) => <TileFace key={i} tile={t} size="sm" />)}</span>;
}

function Section({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="rule" open={open}>
      <summary>{title}</summary>
      <div className="rule-body">{children}</div>
    </details>
  );
}

/** Scoring list grouped by value, built from the same tables the calculator uses. */
function FanTable({ variant }: { variant: Variant }) {
  const rows = variant === 'hk'
    ? Object.values(HK_FANS).map((f) => ({ en: f.en, zh: f.zh, v: f.fan, desc: f.desc }))
    : Object.values(MCR_FANS).map((f) => ({ en: f.en, zh: f.zh, v: f.pts, desc: f.desc }));
  const values = [...new Set(rows.map((r) => r.v))].sort((a, b) => b - a);
  const unit = variant === 'hk' ? 'fan' : 'pts';
  return (
    <div className="fan-table">
      {values.map((v) => (
        <div key={v} className="fan-group">
          <div className="fan-value">{v}<small>{unit}</small></div>
          <ul>
            {rows.filter((r) => r.v === v).map((r) => (
              <li key={r.en}><b>{r.en}</b> <span className="zh-sub">{r.zh}</span><span className="fan-desc">{r.desc}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RulesSheet({ initial, onClose }: { initial: Variant; onClose: () => void }) {
  const [variant, setVariant] = useState<Variant>(initial);
  const hk = variant === 'hk';

  return (
    <Sheet label="Rules" plain onClose={onClose}>
      <h2 className="sheet-title">How to play <span className="zh-sub">玩法</span></h2>
      <div className="segmented rules-tabs">
        <button className={hk ? 'on' : ''} onClick={() => setVariant('hk')}>Hong Kong</button>
        <button className={!hk ? 'on' : ''} onClick={() => setVariant('mcr')}>Chinese (MCR)</button>
      </div>

      <div className="tldr">
        <b>TL;DR</b> — Collect 14 tiles as <b>4 sets + 1 pair</b>. Draw a tile, discard a tile, and grab
        other players' discards when they finish a set. The fancier your hand, the more {hk ? 'fan' : 'points'} you
        score{hk ? ' — most tables need at least 3 fan to win' : ' — you need at least 8 points (not counting flowers) to win'}.
      </div>

      <Section title="🀄 The goal" open>
        <p>A winning hand is <b>four sets and a pair</b> (14 tiles). A set is one of:</p>
        <ul className="defs">
          <li><Tiles tiles={[11, 12, 13]} /><span><b>Chow</b> 上 — a run of 3 in one suit.</span></li>
          <li><Tiles tiles={[31, 31, 31]} /><span><b>Pung</b> 碰 — 3 of the same tile.</span></li>
          <li><Tiles tiles={[8, 8, 8, 8]} /><span><b>Kong</b> 槓 — 4 of the same. Draw an extra replacement tile.</span></li>
          <li><Tiles tiles={[27, 27]} /><span><b>Pair</b> 眼 — 2 of the same (the "eyes").</span></li>
        </ul>
        <p>A few special hands break the pattern, like Seven Pairs and Thirteen Orphans.</p>
      </Section>

      <Section title="🎲 The tiles">
        <ul>
          <li><b>3 suits</b>, numbered 1–9, four copies each: Dots 筒 <Tiles tiles={[13]} />, Bamboo 條 <Tiles tiles={[22]} />, Characters 萬 <Tiles tiles={[4]} />.</li>
          <li><b>Winds</b>: East, South, West, North <Tiles tiles={[27, 28, 29, 30]} /></li>
          <li><b>Dragons</b>: Red, Green, White <Tiles tiles={[31, 32, 33]} /></li>
          <li><b>Flowers & seasons</b>: 8 bonus tiles, numbered 1–4. Put them face up and draw a replacement — they never sit in your hand.</li>
          <li><b>Terminals</b> are the 1s and 9s. <b>Honours</b> are winds and dragons.</li>
        </ul>
      </Section>

      <Section title="🧱 Setting up">
        <ol>
          <li><b>Seats.</b> One player is East, the dealer. South, West and North sit in order going counter-clockwise (to East's right).</li>
          <li><b>Build the wall.</b> Shuffle face down. Each player builds a wall 18 tiles long and 2 high in front of them, then push the four walls into a square.</li>
          {hk ? (
            <li><b>Break the wall.</b> The dealer rolls 3 dice. Count the total counter-clockwise starting from the dealer as 1 to pick a wall, then count that many stacks in from its right end and break it there.</li>
          ) : (
            <li><b>Break the wall.</b> The dealer rolls 2 dice. Count the total counter-clockwise from the dealer to pick who rolls again. Add both rolls, and count that many stacks from the right end of the dealer's wall to make the break.</li>
          )}
          <li><b>Deal.</b> Starting with the dealer, each player takes 4 tiles (2 stacks) clockwise from the break, three times round. Then everyone takes 1 more, and the dealer takes an extra one. Dealer: 14 tiles. Everyone else: 13.</li>
          <li><b>Flowers.</b> Set any flowers aside face up and draw replacements from the <b>back end</b> of the wall.</li>
        </ol>
      </Section>

      <Section title="🔄 Taking a turn">
        <ol>
          <li>The dealer starts by discarding one tile. Play then goes <b>counter-clockwise</b> (to your right).</li>
          <li>On your turn, <b>draw the next tile from the wall</b>, continuing on from the deal. Then <b>discard one tile</b> face up in the middle.</li>
          <li>After a kong or a flower, draw your replacement from the <b>back end</b> of the wall (the tail behind the break).</li>
          <li>If the wall runs out and nobody has won, the hand is a draw and nobody pays.</li>
        </ol>
      </Section>

      <Section title="✋ Claiming discards">
        <ul>
          <li><b>Chow</b> — only from the player right before you (on your left).</li>
          <li><b>Pung / Kong</b> — from anyone, even if it isn't your turn.</li>
          <li><b>Win</b> — from anyone. If two people want the same tile: a win beats a pung or kong, and both beat a chow.</li>
          <li>A claimed set goes face up (<span className="tag-inline tag-revealed">revealed</span>). If you never claim anything, your hand stays <span className="tag-inline tag-concealed">concealed</span>, which is worth extra.</li>
        </ul>
      </Section>

      <Section title="🏆 Winning & getting paid">
        {hk ? (
          <ul>
            <li>Add up the <b>fan</b> for every feature your hand has. Bigger features replace the smaller ones inside them, e.g. Full Flush replaces Mixed Flush.</li>
            <li>Most tables need a <b>minimum of 3 fan</b> to declare a win. A hand with no features is a "chicken hand" (0 fan).</li>
            <li>Hands are capped at <b>13 fan</b> (the limit).</li>
            <li>Fan turn into points: {HK_POINTS.slice(0, 8).map((p, i) => `${i}→${p}`).join(', ')} … 13→{HK_POINTS[13]}.</li>
            <li><b>Self-pick</b>: all three other players pay you. <b>Won on a discard</b>: the discarder pays double, and no one else pays.</li>
          </ul>
        ) : (
          <ul>
            <li>Add up the <b>points</b> for every fan your hand has. You need <b>8 or more</b>, not counting flowers.</li>
            <li>Fan that are implied by a bigger one don't count again, e.g. Full Flush already covers No Honours.</li>
            <li>Each set can only combine with the others once for chow and pung patterns. The calculator handles this for you.</li>
            <li><b>Self-drawn</b>: everyone pays you 8 + your points. <b>Won on a discard</b>: the discarder pays 8 + your points, and the other two pay 8 each.</li>
          </ul>
        )}
      </Section>

      <Section title="🌬️ Rounds & winds">
        <ul>
          <li><b>Seat wind</b> is your seat (East = dealer). <b>Round wind</b> (prevalent wind) starts as East and moves on once every player has dealt.</li>
          <li>A pung of your seat wind or the round wind scores extra.</li>
          {hk
            ? <li>The dealer usually keeps dealing after winning. Otherwise the deal passes to the right (South).</li>
            : <li>The deal passes to the right after <b>every</b> hand, win or lose. A full game is 16 hands.</li>}
        </ul>
      </Section>

      <Section title={hk ? '📋 Every way to score (fan)' : '📋 All 81 fan (points)'}>
        <FanTable variant={variant} />
      </Section>
    </Sheet>
  );
}
