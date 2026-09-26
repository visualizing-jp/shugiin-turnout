/**
 * 時代ビュー。全国の有権者のうち投票した人を、第22回（1946年）から回ごとの棒で見せる。
 */

import { use, useMemo } from "react";
import type { System } from "../../lib/data/cube.ts";
import { FIRST_PR } from "../../lib/data/elections.ts";
import { loadEra } from "../data/load.ts";
import { districtLabel, election, longDate, man, pct, points, year } from "../data/format.ts";
import { SEXES, SEX_LABEL, SEX_TONE, isSex, pick, rateOf, type Sex } from "../data/sex.ts";
import { Preliminary } from "../components/Preliminary.tsx";
import { RateList, RateListHeader, type RateRow } from "../components/RateList.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { SeriesLegend } from "../components/SeriesLegend.tsx";
import { TurnoutBars, toColumn, type Column, type Measure } from "../components/TurnoutBars.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const SYSTEMS = [
  { value: "smd", label: "選挙区" },
  { value: "pr", label: "比例代表" },
] as const;

const MEASURES = [
  { value: "rate", label: "投票率" },
  { value: "count", label: "人数" },
] as const;

const MARKS = [
  { n: FIRST_PR, label: "並立制" },
  { n: 48, label: "18歳選挙権" },
];

export function EraView() {
  const era = use(loadEra());
  const last = era.elections.at(-1)!;

  const [system, setSystem] = useUrlState<System>("sys", "smd", (v) => v === "smd" || v === "pr");
  const [sex, setSex] = useUrlState<Sex>("sex", "all", isSex);
  const [measure, setMeasure] = useUrlState<Measure>("measure", "rate", (v) => v === "rate" || v === "count");
  const [focusParam, setFocus] = useUrlState<string>("n", String(last), (v) => era.elections.includes(Number(v)));
  const focus = Number(focusParam);
  const fi = era.elections.indexOf(focus);
  const series = era[system];

  const columns = useMemo(
    (): Column[] => era.elections.map((n, e) => toColumn(n, series[e] ?? null, sex)),
    [era.elections, series, sex],
  );

  const rows = useMemo(
    (): RateRow[] =>
      era.elections
        .map((n, e) => {
          const c = series[e];
          return { key: String(n), label: `${year(n)} 第${n}回`, rate: c === null || c === undefined ? null : rateOf(pick(c, sex)) };
        })
        .reverse(),
    [era.elections, series, sex],
  );

  const counts = series[fi] ?? null;
  const prev = fi > 0 ? (series[fi - 1] ?? null) : null;
  const t = counts === null ? null : pick(counts, sex);
  const systemName = system === "pr" ? "比例代表" : districtLabel(focus);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[300px] shrink-0 max-lg:w-full lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:self-start">
        <RateListHeader label={`${system === "pr" ? "比例代表" : "選挙区"} ${SEX_LABEL[sex]}`} />
        <RateList rows={rows} selected={focusParam} onSelect={setFocus} color={SEX_TONE[sex].base} />
        <p className="mt-2 border-t border-rule px-2 pt-2 text-[10.5px] leading-relaxed text-faint">
          回を選ぶと、上の要約をその回にする。棒を押しても同じ。
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <h1 className="text-[19px] font-semibold tracking-tight">全国の投票率</h1>
          <div className="flex flex-wrap gap-2">
            <Segmented label="制度" options={SYSTEMS} value={system} onChange={setSystem} />
            <Segmented label="男女" options={SEXES} value={sex} onChange={setSex} />
            <Segmented label="尺度" options={MEASURES} value={measure} onChange={setMeasure} />
          </div>
        </header>

        <p className="tnum min-h-9 pb-3 text-[12.5px]">
          <span className="font-semibold">
            第{focus}回 {longDate(focus)}
          </span>
          {election(focus).edition === "速報" && <Preliminary />}
          {t === null ? (
            <span className="text-muted">{` · 比例代表は第${FIRST_PR}回（1996年）から`}</span>
          ) : (
            <>
              <span className="text-muted">{` · ${systemName}${sex === "all" ? "" : `・${SEX_LABEL[sex]}`} 有権者 ${man(t.electors)} → 投票者 ${man(t.voters)} · `}</span>
              <span className="font-semibold">投票率 {pct(rateOf(t))}</span>
              {prev !== null && <span className="text-muted">{`（前回比 ${points(rateOf(t) - rateOf(pick(prev, sex)))}）`}</span>}
              {counts !== null && sex !== "all" && (
                <span className="text-muted">{` · 女性 − 男性 ${points(rateOf(pick(counts, "f")) - rateOf(pick(counts, "m")))}`}</span>
              )}
            </>
          )}
        </p>

        <div className="flex h-5 items-center">
          <SeriesLegend sex={sex} />
        </div>

        <TurnoutBars
          columns={columns}
          measure={measure}
          focused={focus}
          onFocus={(n) => setFocus(String(n))}
          marks={MARKS}
          height={340}
          label={`全国の${system === "pr" ? "比例代表" : "選挙区"}の${SEX_LABEL[sex]}の${measure === "rate" ? "投票率" : "有権者数と投票者数"}`}
        />

        <ul className="mt-5 flex flex-col gap-1 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          <li>投票率は、投票者数 ÷ 選挙当日の有権者数。棒の濃い部分が投票者、淡い部分が棄権者で、合わせて有権者。</li>
          <li>
            「選挙区」は、第22回が大選挙区、第23〜40回が中選挙区、第41回（1996年）からが小選挙区。比例代表は第41回の小選挙区比例代表並立制の導入から。
          </li>
          <li>
            総務省の注記による制度の変化：1963年（第30回）は投票時間を2時間延長（午後8時まで）。1980年・1986年は衆参同日選挙。2000年（第42回）から投票時間が午後8時まで。2005年（第44回）から期日前投票制度。2017年（第48回）から選挙権年齢が18歳以上。
          </li>
          <li>
            第22〜49回は第49回確定結果調の「男女別投票者数投票率」、第50・51回は各回の結果ページの表（確定結果が未公表のため速報）。
          </li>
        </ul>
      </main>
    </div>
  );
}
