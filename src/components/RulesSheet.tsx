import { ReactNode, useState } from 'react';
import { HK_DESC_ZH, HK_FANS, HK_POINTS, MCR_DESC_ZH, MCR_FANS, Tile, Variant } from '../engine';
import { useLang } from '../i18n';
import { Bi } from './Bi';
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
  const { lang, tx } = useLang();
  const rows = variant === 'hk'
    ? (Object.keys(HK_FANS) as Array<keyof typeof HK_FANS>).map((id) => ({ ...HK_FANS[id], v: HK_FANS[id].fan, d: lang === 'zh' ? HK_DESC_ZH[id] : HK_FANS[id].desc }))
    : (Object.keys(MCR_FANS) as Array<keyof typeof MCR_FANS>).map((id) => ({ ...MCR_FANS[id], v: MCR_FANS[id].pts, d: lang === 'zh' ? MCR_DESC_ZH[id] : MCR_FANS[id].desc }));
  const values = [...new Set(rows.map((r) => r.v))].sort((a, b) => b - a);
  const unit = variant === 'hk' ? tx('fan', '番') : tx('pts', '分');
  return (
    <div className="fan-table">
      {values.map((v) => (
        <div key={v} className="fan-group">
          <div className="fan-value">{v}<small>{unit}</small></div>
          <ul>
            {rows.filter((r) => r.v === v).map((r) => (
              <li key={r.en}><b><Bi en={r.en} zh={r.zh} /></b><span className="fan-desc">{r.d}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RulesSheet({ initial, onClose }: { initial: Variant; onClose: () => void }) {
  const { tx } = useLang();
  const [variant, setVariant] = useState<Variant>(initial);
  const hk = variant === 'hk';

  return (
    <Sheet label={tx('Rules', '規則')} plain onClose={onClose}>
      <h2 className="sheet-title"><Bi en="How to play" zh="玩法" /></h2>
      <div className="segmented rules-tabs">
        <button className={hk ? 'on' : ''} onClick={() => setVariant('hk')}><Bi en="Hong Kong" zh="港式" /></button>
        <button className={!hk ? 'on' : ''} onClick={() => setVariant('mcr')}><Bi en="Chinese (MCR)" zh="國標" /></button>
      </div>

      <div className="tldr">
        {tx(
          <><b>TL;DR</b> — Collect 14 tiles as <b>4 sets + 1 pair</b>. Draw a tile, discard a tile, and grab other players'
            discards when they finish a set. The fancier your hand, the more {hk ? 'fan' : 'points'} you score
            {hk ? ' — most tables need at least 3 fan to win.' : ' — you need at least 8 points (not counting flowers) to win.'}</>,
          <><b>一句講晒</b> —— 湊齊<b>四組牌加一對眼</b>，共 14 張。每輪摸一張、打一張，別人打出你要的牌可以上、碰、槓。{''}
            {'牌型越難，'}{hk ? '番數' : '分數'}越高{hk ? ' —— 一般最少要 3 番才可以食糊。' : ' —— 最少要 8 分（花牌不計）才可以和牌。'}</>,
        )}
      </div>

      <Section title={tx('🀄 The goal', '🀄 目標')} open>
        <p>{tx(<>A winning hand is <b>four sets and a pair</b> (14 tiles). A set is one of:</>, <>和牌要有<b>四組牌加一對眼</b>（共 14 張）。牌組有：</>)}</p>
        <ul className="defs">
          <li><Tiles tiles={[11, 12, 13]} /><span>{tx(<><b>Chow</b> 上 — a run of 3 in one suit.</>, <><b>順子（上）</b>—— 同一花色三張相連。</>)}</span></li>
          <li><Tiles tiles={[31, 31, 31]} /><span>{tx(<><b>Pung</b> 碰 — 3 of the same tile.</>, <><b>刻子（碰）</b>—— 三張一樣的牌。</>)}</span></li>
          <li><Tiles tiles={[8, 8, 8, 8]} /><span>{tx(<><b>Kong</b> 槓 — 4 of the same. Draw an extra replacement tile.</>, <><b>槓</b> —— 四張一樣的牌，要補摸一張。</>)}</span></li>
          <li><Tiles tiles={[27, 27]} /><span>{tx(<><b>Pair</b> 眼 — 2 of the same (the "eyes").</>, <><b>眼（將）</b>—— 兩張一樣的牌。</>)}</span></li>
        </ul>
        <p>{tx('A few special hands break the pattern, like Seven Pairs and Thirteen Orphans.', '另外有些特殊牌型不用跟這個格式，例如七對子、十三么。')}</p>
      </Section>

      <Section title={tx('🎲 The tiles', '🎲 認識麻雀牌')}>
        <ul>
          <li>{tx(<><b>3 suits</b>, numbered 1–9, four copies each:</>, <><b>三種花色</b>，每種一至九，各有四張：</>)} {tx('Dots', '筒子')} <Tiles tiles={[13]} />, {tx('Bamboo', '索子（條）')} <Tiles tiles={[22]} />, {tx('Characters', '萬子')} <Tiles tiles={[4]} /></li>
          <li>{tx(<><b>Winds</b>: East, South, West, North</>, <><b>風牌</b>：東、南、西、北</>)} <Tiles tiles={[27, 28, 29, 30]} /></li>
          <li>{tx(<><b>Dragons</b>: Red, Green, White</>, <><b>三元牌</b>：中、發、白</>)} <Tiles tiles={[31, 32, 33]} /></li>
          <li>{tx(
            <><b>Flowers & seasons</b>: 8 bonus tiles, numbered 1–4. Put them face up and draw a replacement — they never sit in your hand.</>,
            <><b>花季</b>：共 8 隻，編號 1–4。摸到要即時打開放在面前，再補摸一張，不會留在手牌。</>,
          )}</li>
          <li>{tx(<><b>Terminals</b> are the 1s and 9s. <b>Honours</b> are winds and dragons.</>, <><b>么九</b>是一和九；<b>字牌</b>是風牌和三元牌。</>)}</li>
        </ul>
      </Section>

      <Section title={tx('🧱 Setting up', '🧱 開局')}>
        <ol>
          <li>{tx(
            <><b>Seats.</b> One player is East, the dealer. South, West and North sit in order going counter-clockwise (to East's right).</>,
            <><b>坐位：</b>其中一人坐東位做莊家，南、西、北依逆時針方向（莊家右手邊開始）坐。</>,
          )}</li>
          <li>{tx(
            <><b>Build the wall.</b> Shuffle face down. Each player builds a wall 18 tiles long and 2 high in front of them, then push the four walls into a square.</>,
            <><b>砌牌：</b>牌面向下洗牌，每人在面前砌一道 18 疊、兩層高的牌牆，四道圍成正方形。</>,
          )}</li>
          {hk ? (
            <li>{tx(
              <><b>Break the wall.</b> The dealer rolls 3 dice. Count the total counter-clockwise starting from the dealer as 1 to pick a wall, then count that many stacks in from its right end and break it there.</>,
              <><b>開牌：</b>莊家擲三粒骰，由莊家起計 1，逆時針數到點數的那一家；再在那道牌牆從右邊數相同的疊數，在那裡開牌。</>,
            )}</li>
          ) : (
            <li>{tx(
              <><b>Break the wall.</b> The dealer rolls 2 dice. Count the total counter-clockwise from the dealer to pick who rolls again. Add both rolls, and count that many stacks from the right end of the dealer's wall to make the break.</>,
              <><b>開牌：</b>莊家擲兩粒骰，由莊家起逆時針數點數，決定誰擲第二次。兩次點數相加，在莊家牌牆從右邊數相同的疊數開牌。</>,
            )}</li>
          )}
          <li>{tx(
            <><b>Deal.</b> Starting with the dealer, each player takes 4 tiles (2 stacks) clockwise from the break, three times round. Then everyone takes 1 more, and the dealer takes an extra one. Dealer: 14 tiles. Everyone else: 13.</>,
            <><b>摸牌：</b>由莊家開始，每人輪流在開牌位順時針拿 4 張（兩疊），共三輪；之後每人再拿 1 張，莊家多拿 1 張。莊家 14 張，其他人 13 張。</>,
          )}</li>
          <li>{tx(
            <><b>Flowers.</b> Set any flowers aside face up and draw replacements from the <b>back end</b> of the wall.</>,
            <><b>補花：</b>有花就打開放好，從牌牆<b>尾</b>補回同樣數量的牌。</>,
          )}</li>
        </ol>
      </Section>

      <Section title={tx('🔄 Taking a turn', '🔄 輪流摸打')}>
        <ol>
          <li>{tx(<>The dealer starts by discarding one tile. Play then goes <b>counter-clockwise</b> (to your right).</>, <>莊家先打出一張牌，之後按<b>逆時針</b>（向右）輪流。</>)}</li>
          <li>{tx(
            <>On your turn, <b>draw the next tile from the wall</b>, continuing on from the deal. Then <b>discard one tile</b> face up in the middle.</>,
            <>輪到你時，<b>從牌牆摸下一張</b>（接著發牌的位置），然後<b>打出一張</b>，牌面向上放在中間。</>,
          )}</li>
          <li>{tx(
            <>After a kong or a flower, draw your replacement from the <b>back end</b> of the wall (the tail behind the break).</>,
            <>開槓或補花後，從牌牆<b>尾</b>（開牌位的另一端）補牌。</>,
          )}</li>
          <li>{tx('If the wall runs out and nobody has won, the hand is a draw and nobody pays.', '牌摸完都沒有人和，就是流局，不用找數。')}</li>
        </ol>
      </Section>

      <Section title={tx('✋ Claiming discards', '✋ 上、碰、槓、食糊')}>
        <ul>
          <li>{tx(<><b>Chow</b> — only from the player right before you (on your left).</>, <><b>上</b> —— 只可以上上家（左手邊）打出的牌。</>)}</li>
          <li>{tx(<><b>Pung / Kong</b> — from anyone, even if it isn't your turn.</>, <><b>碰／槓</b> —— 任何人打出的牌都可以，不用等輪到你。</>)}</li>
          <li>{tx(
            <><b>Win</b> — from anyone. If two people want the same tile: a win beats a pung or kong, and both beat a chow.</>,
            <><b>食糊</b> —— 任何人打出的牌都可以。兩人同時要同一張牌：食糊優先於碰／槓，碰／槓優先於上。</>,
          )}</li>
          <li>{tx(
            <>A claimed set goes face up (<span className="tag-inline tag-revealed">revealed</span>). If you never claim anything, your hand stays <span className="tag-inline tag-concealed">concealed</span>, which is worth extra.</>,
            <>上、碰、槓回來的牌要打開（<span className="tag-inline tag-revealed">明牌</span>）。完全沒有上碰的手牌是<span className="tag-inline tag-concealed">門前清</span>，可以多計番。</>,
          )}</li>
        </ul>
      </Section>

      <Section title={tx('🏆 Winning & getting paid', '🏆 和牌及找數')}>
        {hk ? (
          <ul>
            <li>{tx(
              <>Add up the <b>fan</b> for every feature your hand has. Bigger features replace the smaller ones inside them, e.g. Full Flush replaces Mixed Flush.</>,
              <>把手牌所有番種的<b>番數</b>加起來。大番種會取代包含在內的小番種，例如清一色取代混一色。</>,
            )}</li>
            <li>{tx(
              <>Most tables need a <b>minimum of 3 fan</b> to declare a win. A hand with no features is a "chicken hand" (0 fan).</>,
              <>一般要<b>最少 3 番</b>才可以食糊。沒有番的和牌叫「雞糊」（0 番）。</>,
            )}</li>
            <li>{tx(<>Hands are capped at <b>13 fan</b> (the limit).</>, <>最高 <b>13 番</b>（爆棚）。</>)}</li>
            <li>{tx('Fan turn into points: ', '番數對應分數：')}{HK_POINTS.slice(0, 8).map((p, i) => `${i}→${p}`).join(', ')} … 13→{HK_POINTS[13]}.</li>
            <li>{tx(
              <><b>Self-pick</b>: all three other players pay you. <b>Won on a discard</b>: the discarder pays double, and no one else pays.</>,
              <><b>自摸</b>：三家都要付錢。<b>食糊（出銃）</b>：出銃的一家付雙倍，其他人不用付。</>,
            )}</li>
          </ul>
        ) : (
          <ul>
            <li>{tx(<>Add up the <b>points</b> for every fan your hand has. You need <b>8 or more</b>, not counting flowers.</>, <>把所有番種的<b>分數</b>加起來，花牌以外要有 <b>8 分或以上</b>才可以和牌。</>)}</li>
            <li>{tx("Fan that are implied by a bigger one don't count again, e.g. Full Flush already covers No Honours.", '被大番種包含的小番種不重複計算，例如清一色不再計無字。')}</li>
            <li>{tx('Each set can only combine with the others once for chow and pung patterns. The calculator handles this for you.', '組合番種時每組牌只可以與已用過的牌組再組合一次（套算一次原則），計番器會自動處理。')}</li>
            <li>{tx(
              <><b>Self-drawn</b>: everyone pays you 8 + your points. <b>Won on a discard</b>: the discarder pays 8 + your points, and the other two pay 8 each.</>,
              <><b>自摸</b>：三家各付 8 分 + 你的分數。<b>點炮</b>：點炮的一家付 8 分 + 你的分數，另外兩家各付 8 分。</>,
            )}</li>
          </ul>
        )}
      </Section>

      <Section title={tx('🌬️ Rounds & winds', '🌬️ 圈風及門風')}>
        <ul>
          <li>{tx(
            <><b>Seat wind</b> is your seat (East = dealer). <b>Round wind</b> (prevalent wind) starts as East and moves on once every player has dealt.</>,
            <><b>門風</b>是你的座位（東 = 莊家）。<b>圈風</b>由東圈開始，每人做過一次莊後轉下一圈。</>,
          )}</li>
          <li>{tx('A pung of your seat wind or the round wind scores extra.', '門風或圈風的刻子可以加番。')}</li>
          {hk
            ? <li>{tx('The dealer usually keeps dealing after winning. Otherwise the deal passes to the right (South).', '莊家食糊通常可以連莊，否則由右手邊（南家）做莊。')}</li>
            : <li>{tx(<>The deal passes to the right after <b>every</b> hand, win or lose. A full game is 16 hands.</>, <>不論輸贏，<b>每局</b>都由右手邊的人接莊，一場共 16 局。</>)}</li>}
        </ul>
      </Section>

      <Section title={hk ? tx('📋 Every way to score (fan)', '📋 全部番種') : tx('📋 All 81 fan (points)', '📋 81 種番種')}>
        <FanTable variant={variant} />
      </Section>
    </Sheet>
  );
}
