/**
 * 都道府県ビュー。回・制度・男女を選んで都道府県を投票率で塗り、選んだ県（または全国）の回ごとの投票率を横に出す。
 */

import { use, useMemo } from "react";
import { prefCode } from "../../lib/data/areas.ts";
import type { System } from "../../lib/data/cube.ts";
import { RATE_DOMAIN, roundDomain } from "../../lib/data/palette.ts";
import { loadPref } from "../data/load.ts";
import { election, longDate, num, pct, points } from "../data/format.ts";
import { SEXES, SEX_LABEL, SEX_TONE, isSex, pick, rateOf, sumCounts, type Sex } from "../data/sex.ts";
import { ElectionSelect } from "../components/ElectionSelect.tsx";
import { Preliminary } from "../components/Preliminary.tsx";
import { RateList, RateListHeader, type RateRow } from "../components/RateList.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { SeriesLegend } from "../components/SeriesLegend.tsx";
import { TileMap } from "../components/TileMap.tsx";
import { TurnoutBars, toColumn, type Column } from "../components/TurnoutBars.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const SYSTEMS = [
  { value: "smd", label: "小選挙区" },
  { value: "pr", label: "比例代表" },
] as const;

const SYSTEM_LABEL: Record<System, string> = { smd: "小選挙区", pr: "比例代表" };

type Scale = "round" | "common";

const SCALES = [
  { value: "round", label: "この回の範囲" },
  { value: "common", label: "全回共通" },
] as const;

export function PrefView() {
  const data = use(loadPref());
  const last = data.elections.at(-1)!;

  const [nParam, setN] = useUrlState<string>("n", String(last), (v) => data.elections.includes(Number(v)));
  const [system, setSystem] = useUrlState<System>("sys", "smd", (v) => v === "smd" || v === "pr");
  const [sex, setSex] = useUrlState<Sex>("sex", "all", isSex);
  const [area, setArea] = useUrlState<string>("area", "", (v) => data.prefs.includes(v));
  const [scale, setScale] = useUrlState<Scale>("scale", "round", (v) => v === "round" || v === "common");
  const n = Number(nParam);
  const ei = data.elections.indexOf(n);
  const ai = area === "" ? -1 : data.prefs.indexOf(area);
  const byPref = data[system][ei]!;
  const tone = SEX_TONE[sex];

  const national = useMemo(() => data[system].map((rows) => sumCounts(rows)), [data, system]);
  const nationalRate = rateOf(pick(national[ei]!, sex));

  const ranked = useMemo(
    () =>
      data.prefs
        .map((name, i) => ({ name, rate: rateOf(pick(byPref[i]!, sex)) }))
        .sort((a, b) => b.rate - a.rate),
    [data.prefs, byPref, sex],
  );
  const rows: RateRow[] = ranked.map((r, i) => ({ key: r.name, label: r.name, rate: r.rate, aside: String(i + 1) }));
  const top = ranked[0]!;
  const bottom = ranked.at(-1)!;
  // この回の範囲：県どうしの差を見る。全回共通：回や男女をまたいで同じ明るさが同じ投票率になる。
  const domain = scale === "round" ? roundDomain(ranked.map((r) => r.rate)) : RATE_DOMAIN;

  const tiles = data.prefs.map((name, i) => {
    const t = pick(byPref[i]!, sex);
    return {
      code: prefCode(name),
      label: name,
      rate: rateOf(t),
      text: pct(rateOf(t)).replace("%", ""),
      title: `${name} ${SEX_LABEL[sex]} 投票率 ${pct(rateOf(t))}（投票者 ${num(t.voters)}人 ÷ 有権者 ${num(t.electors)}人）`,
    };
  });

  const columns = useMemo(
    (): Column[] =>
      data.elections.map((en, e) => toColumn(en, ai < 0 ? national[e]! : data[system][e]![ai]!, sex)),
    [data, system, national, ai, sex],
  );

  const where = area === "" ? "全国" : area;
  const focusCounts = pick(ai < 0 ? national[ei]! : byPref[ai]!, sex);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[300px] shrink-0 max-lg:w-full lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:self-start">
        <RateListHeader label={`第${n}回 ${SYSTEM_LABEL[system]} ${SEX_LABEL[sex]}`} domain={domain} />
        <RateList
          rows={rows}
          selected={area}
          onSelect={(p) => setArea(p === area ? "" : p)}
          color={tone.base}
          domain={domain}
          reference={nationalRate}
          none={{ label: "全国", rate: nationalRate }}
        />
        <p className="mt-2 border-t border-rule px-2 pt-2 text-[10.5px] leading-relaxed text-faint">
          投票率の高い順。棒の尺度は地図の目盛りと同じで、縦線が全国。都道府県を選ぶと、推移をその都道府県にする。同じ都道府県をもう一度押すと全国に戻す。
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <h1 className="text-[19px] font-semibold tracking-tight">都道府県の投票率</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="制度" options={SYSTEMS} value={system} onChange={setSystem} />
            <Segmented label="男女" options={SEXES} value={sex} onChange={setSex} />
            <ElectionSelect elections={data.elections} value={n} onChange={(v) => setN(String(v))} />
          </div>
        </header>

        <p className="tnum min-h-9 pb-4 text-[12.5px]">
          <span className="font-semibold">
            第{n}回 {longDate(n)}
          </span>
          {election(n).edition === "速報" && <Preliminary />}
          <span className="text-muted">{` · 全国 ${pct(nationalRate)} · 最も高い `}</span>
          <span className="font-semibold">
            {top.name} {pct(top.rate)}
          </span>
          <span className="text-muted"> · 最も低い </span>
          <span className="font-semibold">
            {bottom.name} {pct(bottom.rate)}
          </span>
          <span className="text-muted">{`（差 ${points(top.rate - bottom.rate).replace("+", "")}）`}</span>
        </p>

        <div className="grid gap-8 xl:grid-cols-[minmax(460px,1fr)_minmax(340px,0.85fr)]">
          <section aria-label="都道府県別の投票率" className="min-w-0">
            <TileMap
              tiles={tiles}
              hue={tone.hue}
              pinned={area === "" ? null : prefCode(area)}
              onPin={(code) => setArea(code === null ? "" : data.prefs[Number(code) - 1]!)}
              domain={domain}
              legend={{
                title: `${SYSTEM_LABEL[system]}の投票率（${SEX_LABEL[sex]}）`,
                note:
                  scale === "round"
                    ? "濃いほど高い。目盛りはこの回の最低〜最高。"
                    : "濃いほど高い。目盛りは全回・制度・男女で共通。",
              }}
            />
            <div className="flex items-center gap-2 pt-3">
              <span className="text-[11px] text-muted">目盛り</span>
              <Segmented label="目盛り" options={SCALES} value={scale} onChange={setScale} />
            </div>
          </section>

          <section aria-label="推移" className="min-w-0">
            <h2 className="flex items-baseline justify-between pb-2">
              <span className="text-[14px] font-semibold">
                {where}の推移
                <span className="ml-2 text-[11px] font-normal text-muted">{SYSTEM_LABEL[system]}</span>
              </span>
              {area !== "" && (
                <button
                  type="button"
                  onClick={() => setArea("")}
                  className="cursor-pointer text-[11px] text-muted transition-colors duration-150 hover:text-ink"
                >
                  全国に戻す
                </button>
              )}
            </h2>
            <div className="flex h-5 items-center pb-1">
              <SeriesLegend sex={sex} />
            </div>
            <TurnoutBars
              columns={columns}
              measure="rate"
              focused={n}
              onFocus={(v) => setN(String(v))}
              height={280}
              label={`${where}の${SYSTEM_LABEL[system]}の${SEX_LABEL[sex]}の投票率`}
            />
            <p className="pt-2 text-[11px] leading-relaxed text-faint">
              {`${where}・第${n}回：有権者 ${num(focusCounts.electors)}人のうち投票者 ${num(focusCounts.voters)}人（${SEX_LABEL[sex]}）`}
              {area === "" && "。都道府県を選ぶと、その都道府県の推移に切り替わる。"}
            </p>
          </section>
        </div>

        <ul className="mt-5 flex flex-col gap-1 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          <li>投票率は、投票者数 ÷ 選挙当日の有権者数。在外選挙人は、登録先の都道府県の数に含まれている（結果調の「うち在外」）。</li>
          <li>
            地図は模式図。目盛り「この回の範囲」は、選んだ回・制度・男女の最低〜最高（整数の%に丸める）で塗り、県どうしの差を見やすくする。
            「全回共通」は 40〜80% で、どの回・制度・男女でも同じ明るさは同じ投票率を表す。
          </li>
          <li>都道府県別は第44回（2005年）から。それより前の回は「時代」で全国値だけを見られる。</li>
          <li>
            各回の結果ページの表による。第45・46・48・49回は、全国の人数が確定結果調と最大5人違う（投票率は小数第2位まで同じ）。第50・51回は確定結果が未公表のため速報。
          </li>
        </ul>
      </main>
    </div>
  );
}
