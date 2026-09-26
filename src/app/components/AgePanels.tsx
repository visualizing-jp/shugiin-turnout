/**
 * 年代ごとの投票率の推移を、同じ目盛り（0〜100%）の小さな棒グラフで並べる。
 * 各回の「全体」の投票率を短い横線で重ね、年代と全体の差を棒の上端と線の差で読ませる。
 */

import { scaleBand, scaleLinear } from "d3-scale";
import { election, pct, points, year } from "../data/format.ts";
import { useWidth } from "../hooks/useWidth.ts";

const BAR = "#b9b4ab";
const BAR_FOCUSED = "#16140f";

export function AgePanels({
  elections,
  groups,
  rates,
  total,
  focused,
  onFocus,
}: {
  elections: number[];
  groups: string[];
  /** rates[年代][回]（0〜1）。 */
  rates: (number | null)[][];
  total: number[];
  focused: number;
  onFocus: (n: number) => void;
}) {
  const fi = elections.indexOf(focused);
  return (
    // 7つの年代。広い画面では4列（4 + 3）にして、1つだけ余る段を作らない。
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
      {groups.map((g, i) => {
        const r = rates[i]![fi];
        return (
          <section
            key={g}
            aria-label={`${g}の投票率の推移`}
            className="min-w-0 rounded-md px-2 pt-1.5 pb-1 shadow-[0_0_0_1px_var(--color-rule)]"
          >
            <h3 className="tnum flex items-baseline justify-between gap-2 pb-0.5 text-[12px]">
              <span className="font-semibold">{g}</span>
              <span className="text-muted">
                {r === null || r === undefined ? (
                  "調査なし"
                ) : (
                  <>
                    <span className="font-semibold text-ink">{pct(r)}</span>
                    <span className="ml-1.5 text-[11px]">全体比 {points(r - total[fi]!)}</span>
                  </>
                )}
              </span>
            </h3>
            <MiniBars elections={elections} values={rates[i]!} total={total} focused={focused} onFocus={onFocus} label={`${g}の投票率`} />
          </section>
        );
      })}
    </div>
  );
}

function MiniBars({
  elections,
  values,
  total,
  focused,
  onFocus,
  label,
}: {
  elections: number[];
  values: (number | null)[];
  total: number[];
  focused: number;
  onFocus: (n: number) => void;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const height = 116;
  const M = { left: 32, right: 2, top: 6, bottom: 18 };
  const y = scaleLinear().domain([0, 1]).range([height - M.bottom, M.top]);
  const band = scaleBand<number>()
    .domain(elections)
    .range([M.left, Math.max(M.left + 1, width - M.right)])
    .paddingInner(0.25);
  const bw = band.bandwidth();
  // 両端の年と焦点の回の年を書く。焦点が端に近いと重なるので、その端の年は書かない。
  const fi = elections.indexOf(focused);
  const near = Math.ceil(34 / band.step());
  const first = fi >= near ? elections[0] : undefined;
  const last = elections.length - 1 - fi >= near ? elections.at(-1) : undefined;

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          {[0, 0.5, 1].map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x1={M.left} x2={width - M.right} className="stroke-rule" />
              <text x={M.left - 4} dy="0.32em" textAnchor="end" className="tnum fill-faint text-[9px]">
                {t * 100}%
              </text>
            </g>
          ))}
          {elections.map((n, i) => {
            const v = values[i];
            const x = band(n)!;
            const isFocused = n === focused;
            return (
              <g
                key={n}
                role="button"
                tabIndex={-1}
                aria-label={`第${n}回（${year(n)}年）`}
                onClick={() => onFocus(n)}
                className="group cursor-pointer"
              >
                <rect
                  x={x - band.step() * 0.125}
                  width={band.step()}
                  y={M.top}
                  height={height - M.top - M.bottom}
                  className={isFocused ? "fill-ink/[0.045]" : "fill-transparent group-hover:fill-ink/[0.025]"}
                />
                {v !== null && v !== undefined && (
                  <rect
                    x={x}
                    width={bw}
                    y={y(v)}
                    height={y(0) - y(v)}
                    fill={isFocused ? BAR_FOCUSED : BAR}
                    className="transition-[fill] duration-150 ease-out"
                  >
                    <title>{`第${n}回（${year(n)}年） ${pct(v)}（全体 ${pct(total[i]!)}）`}</title>
                  </rect>
                )}
                <line
                  x1={x - 1}
                  x2={x + bw + 1}
                  y1={y(total[i]!)}
                  y2={y(total[i]!)}
                  strokeWidth={1.5}
                  className={`pointer-events-none ${isFocused ? "stroke-ink" : "stroke-muted"}`}
                />
                {(n === first || n === last || isFocused) && (
                  <text
                    x={i === 0 ? x : i === elections.length - 1 ? x + bw : x + bw / 2}
                    y={height - 5}
                    textAnchor={i === 0 ? "start" : i === elections.length - 1 ? "end" : "middle"}
                    className={`tnum text-[9.5px] ${isFocused ? "fill-ink font-semibold" : "fill-faint"}`}
                  >
                    {year(n)}
                    {isFocused && election(n).edition === "速報" ? " 速報" : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
