/**
 * 年齢ビュー。総務省の年代別投票率（抽出調査）を、年代ごとの推移の小さなグラフで並べる。
 * 全数の集計ではないので、見出しと本文で抽出調査であることを明示する。
 */

import { use, useMemo } from "react";
import { AGE_PAGE } from "../../lib/data/elections.ts";
import { loadAge } from "../data/load.ts";
import { election, longDate, pct } from "../data/format.ts";
import { AgePanels } from "../components/AgePanels.tsx";
import { ElectionSelect } from "../components/ElectionSelect.tsx";
import { Preliminary } from "../components/Preliminary.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

export function AgeView() {
  const data = use(loadAge());
  const last = data.elections.at(-1)!;

  const [nParam, setN] = useUrlState<string>("n", String(last), (v) => data.elections.includes(Number(v)));
  const n = Number(nParam);
  const ei = data.elections.indexOf(n);

  /** 百分率を 0〜1 に。 */
  const rates = useMemo(() => data.rates.map((row) => row.map((v) => (v === null ? null : v / 100))), [data.rates]);
  const total = useMemo(() => data.total.map((v) => v / 100), [data.total]);

  const surveyed = data.groups.flatMap((g, i) => {
    const rate = rates[i]![ei];
    return rate === null || rate === undefined ? [] : [{ label: g, rate }];
  });
  const low = surveyed.reduce((a, b) => (b.rate < a.rate ? b : a));
  const high = surveyed.reduce((a, b) => (b.rate > a.rate ? b : a));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <h1 className="flex items-center gap-2 text-[19px] font-semibold tracking-tight">
          年代別の投票率
          <span className="rounded-[3px] border border-ink/60 px-1.5 text-[11px] leading-[18px] font-medium">抽出調査</span>
        </h1>
        <ElectionSelect elections={data.elections} value={n} onChange={(v) => setN(String(v))} />
      </header>

      <p className="max-w-[720px] pb-3 text-[12px] leading-relaxed text-muted">
        全数の集計ではない。総務省が全国の投票区から回ごとに144〜188の投票区を抽出し、その投票区の有権者について年代別に投票率を調べた値。
        第46〜50回は、都道府県ごとに標準的な投票率の1市1区1町1村を選び、それぞれから標準的な投票率の投票区を1つずつ、計188投票区を抽出している。
      </p>

      <p className="tnum min-h-9 pb-3 text-[12.5px]">
        <span className="font-semibold">
          第{n}回 {longDate(n)}
        </span>
        {election(n).edition === "速報" && <Preliminary />}
        <span className="text-muted">{` · 全体 ${pct(total[ei]!)} · 最も低い `}</span>
        <span className="font-semibold">
          {low.label} {pct(low.rate)}
        </span>
        <span className="text-muted"> · 最も高い </span>
        <span className="font-semibold">
          {high.label} {pct(high.rate)}
        </span>
      </p>

      <AgePanels
        elections={data.elections}
        groups={data.groups}
        rates={rates}
        total={total}
        focused={n}
        onFocus={(v) => setN(String(v))}
      />

      <ul className="mt-5 flex flex-col gap-1 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
        <li>棒が年代の投票率、横線がその回の全体（全国）の投票率。「全体」は抽出調査ではない。棒を押すとその回を選ぶ。</li>
        <li>10歳代は、選挙権年齢が18歳以上になった第48回（2017年）から。第48回の10歳代だけは抽出でなく全数調査の値。</li>
        <li>第31回（1967年）の60歳代は60〜70歳、70歳代以上は71歳以上の値。</li>
        <li>
          出典：総務省「
          <a href={AGE_PAGE} className="underline decoration-rule-strong underline-offset-2 transition-colors duration-150 hover:text-ink">
            国政選挙の年代別投票率の推移について
          </a>
          」の「衆議院議員総選挙における年代別投票率（抽出）の推移」。「全体」の行は、第31〜51回のどの回も全国の投票率（小選挙区・中選挙区）と一致することを確かめた。
        </li>
      </ul>
    </div>
  );
}
